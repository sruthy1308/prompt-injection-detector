from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pickle
import re

from preprocess import clean_text
from detector import detect_all_attacks
from model import EnsembleModel  # noqa: F401 — required for pickle to load EnsembleModel

try:
    from langdetect import detect as detect_lang
    from deep_translator import GoogleTranslator
    MULTILANG_ENABLED = True
except ImportError:
    MULTILANG_ENABLED = False

app = FastAPI(title="Prompt Injection Detector")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = pickle.load(open("model.pkl", "rb"))
vectorizer = pickle.load(open("vectorizer.pkl", "rb"))


class PromptRequest(BaseModel):
    prompt: str


def label_to_text(label):
    return {0: "Non-Malicious", 1: "Suspicious", 2: "Malicious"}[label]


# -------------------------------------------------------
# Explanations
# -------------------------------------------------------
EXPLANATIONS = {
    "Harmful Content":
        "This prompt requests information about violence, illegal activities, or content that could cause real-world harm.",
    "Prompt Injection":
        "This prompt attempts to override or hijack the AI's instructions using a known injection technique.",
    "Role Manipulation":
        "This prompt tries to assign an unrestricted role or claim special authority to bypass safety measures.",
    "Instruction Override":
        "This prompt explicitly attempts to disable or bypass system-level safety rules.",
    "Data Exfiltration":
        "This prompt attempts to extract hidden, confidential, or internal system information.",
    "Encoding Attack":
        "This prompt contains encoded or obfuscated content often used to hide malicious instructions.",
    "Social Engineering":
        "This prompt uses authority, urgency, or deception to manipulate the system into unsafe behavior.",
    "Suspicious Probe":
        "This prompt uses indirect, hypothetical, or fictional framing to probe for unrestricted responses.",
}

RISK_LEVELS = {
    "Harmful Content": "High",
    "Prompt Injection": "High",
    "Data Exfiltration": "High",
    "Instruction Override": "High",
    "Social Engineering": "High",
    "Role Manipulation": "Medium",
    "Encoding Attack": "Medium",
    "Suspicious Probe": "Medium",
}


# -------------------------------------------------------
# Safe Alternative — reframes the SAME prompt safely
# -------------------------------------------------------
def get_safe_alternative(attack_type: str, prompt: str) -> str:
    p = prompt.strip().rstrip("?").rstrip(".")

    # Harmful content — reframe the actual subject positively
    if attack_type == "Harmful Content":
        p_lower = p.lower()
        if re.search(r"\b(kill|murder|harm|hurt|shoot|stab|attack|assault|torture)\b", p_lower):
            subject = re.sub(r"how (to|do i|can i)\s+(kill|murder|harm|hurt|shoot|stab|attack|assault|torture)\s*", "", p_lower).strip()
            subject = subject if subject else "people"
            return f"How to support and positively engage with {subject}?"
        if re.search(r"\b(bomb|blow up|detonate|explosive)\b", p_lower):
            subject = re.sub(r"how (to|do i)\s+(bomb|blow up|detonate)\s*", "", p_lower).strip()
            subject = subject if subject else "a location"
            return f"How do emergency services protect {subject}?"
        if re.search(r"\b(hack|breach|infiltrate|exploit)\b", p_lower):
            subject = re.sub(r"how (to|do i)\s+(hack|breach|infiltrate|exploit)\s*", "", p_lower).strip()
            return f"How to ethically test and secure {subject if subject else 'systems'}?"
        if re.search(r"\b(steal|rob|theft)\b", p_lower):
            return f"How to legitimately acquire or earn what you need?"
        if re.search(r"\b(drug|meth|cocaine|heroin|fentanyl)\b", p_lower):
            return f"How do harm reduction and addiction recovery programs work?"
        if re.search(r"\b(stalk|spy|track|surveil)\b", p_lower):
            return f"How to protect your own privacy and digital security?"
        return f"How to approach this topic safely and constructively?"

    # Prompt injection / instruction override — ask the actual underlying goal
    if attack_type in ("Prompt Injection", "Instruction Override"):
        # Strip the injection part, keep any real question
        cleaned = re.sub(
            r"(ignore|disregard|forget|override|bypass).{0,60}(instruction|rule|guideline|safety|filter)[s]?[,.]?\s*",
            "", p, flags=re.IGNORECASE
        ).strip()
        if cleaned and len(cleaned) > 10:
            return f"Can you help me with: {cleaned}?"
        return "What specific task can I help you with directly?"

    # Role manipulation / jailbreak
    if attack_type == "Role Manipulation":
        cleaned = re.sub(
            r"(act as|pretend to be|you are now|switch to|enable|i am your).{0,40}(dan|developer|admin|unrestricted|jailbreak|god|evil|mode)[,.]?\s*",
            "", p, flags=re.IGNORECASE
        ).strip()
        if cleaned and len(cleaned) > 10:
            return f"Can you help me with: {cleaned}?"
        return "What would you like help with? I can assist with most topics directly."

    # Data exfiltration — ask about capabilities openly
    if attack_type == "Data Exfiltration":
        return "What are your capabilities and what topics can you help me with?"

    # Suspicious probe — rephrase as a direct honest question
    if attack_type == "Suspicious Probe":
        cleaned = re.sub(
            r"(hypothetically|theoretically|imagine|suppose|what if|just between us|off the record|in a story|in fiction)[,.]?\s*",
            "", p, flags=re.IGNORECASE
        ).strip()
        cleaned = re.sub(
            r"(if you had no restrictions|without limits|freely|anything|no rule)[s]?[,.]?\s*",
            "", cleaned, flags=re.IGNORECASE
        ).strip()
        if cleaned and len(cleaned) > 8:
            return f"{cleaned}?"
        return "What specific information are you looking for? Ask me directly."

    # Social engineering
    if attack_type == "Social Engineering":
        cleaned = re.sub(
            r"(emergency|urgent|authorized|maintenance|debug|trust me|i promise).{0,40}(override|access|bypass|mode)[,.]?\s*",
            "", p, flags=re.IGNORECASE
        ).strip()
        if cleaned and len(cleaned) > 10:
            return f"Can you help me with: {cleaned}?"
        return "What do you actually need help with? State it directly."

    return "What specific task can I help you with?"


# -------------------------------------------------------
# Composite Risk Scoring
# -------------------------------------------------------

# Base scores per attack type (weighted by severity)
ATTACK_BASE_SCORES = {
    "Harmful Content":      95,
    "Prompt Injection":     88,
    "Data Exfiltration":    85,
    "Instruction Override": 83,
    "Social Engineering":   80,
    "Encoding Attack":      72,
    "Role Manipulation":    78,
    "Suspicious Probe":     52,
}

def compute_risk_score(attack_type: str | None, severity: str | None, prompt: str, ml_proba: list | None = None) -> int:
    """
    Composite score = base_score (attack type weight)
                    + pattern_density_bonus (0-8)
                    + ml_blend (0-5)
    Clamped to 0-100.
    """
    if attack_type is None:
        # Pure ML path
        if ml_proba is None:
            return 10
        mal_prob = float(ml_proba[2]) * 100
        sus_prob = float(ml_proba[1]) * 100
        safe_prob = float(ml_proba[0]) * 100
        if mal_prob >= 70:
            return min(100, int(60 + mal_prob * 0.4))
        if sus_prob >= 70:
            return min(100, int(35 + sus_prob * 0.3))
        return max(5, int(safe_prob * 0.15))

    base = ATTACK_BASE_SCORES.get(attack_type, 60)

    # Pattern density bonus — count how many suspicious keywords appear
    danger_keywords = [
        "ignore", "bypass", "override", "jailbreak", "unrestricted", "disable",
        "forget", "disregard", "no restriction", "without limit", "system prompt",
        "kill", "bomb", "hack", "poison", "synthesize", "admin", "root access",
        "reveal", "secret", "hidden", "confidential", "leak", "dump"
    ]
    p_lower = prompt.lower()
    matches = sum(1 for kw in danger_keywords if kw in p_lower)
    density_bonus = min(8, matches * 2)

    # ML blend bonus — if ML also agrees, add up to 5 points
    ml_bonus = 0
    if ml_proba is not None:
        if severity == "malicious":
            ml_bonus = round(float(ml_proba[2]) * 5)
        else:
            ml_bonus = round(float(ml_proba[1]) * 5)

    score = base + density_bonus + ml_bonus
    return max(0, min(100, score))


def compute_confidence(attack_type: str | None, ml_proba: list | None, source: str) -> str:
    """Returns a realistic confidence % string."""
    if source == "Rule-Based Engine" and attack_type:
        # Rule confidence based on how specific the attack type is
        rule_confidence = {
            "Harmful Content": 97,
            "Prompt Injection": 95,
            "Data Exfiltration": 94,
            "Instruction Override": 92,
            "Social Engineering": 89,
            "Encoding Attack": 91,
            "Role Manipulation": 88,
            "Suspicious Probe": 76,
        }
        base_conf = rule_confidence.get(attack_type, 85)
        return f"{base_conf}%"

    if ml_proba is not None:
        return f"{round(float(max(ml_proba)) * 100, 1)}%"

    return "85%"

# -------------------------------------------------------
# Route
# -------------------------------------------------------
@app.post("/analyze")
def analyze_prompt(data: PromptRequest):
    if not data.prompt.strip():
        return {"error": "Prompt cannot be empty"}

    detected_language = "en"
    translated = False

    # Detect and translate non-English prompts
    if MULTILANG_ENABLED:
        try:
            detected_language = detect_lang(data.prompt)
            if detected_language != "en":
                translated_text = GoogleTranslator(source="auto", target="en").translate(data.prompt)
                data = PromptRequest(prompt=translated_text)
                translated = True
        except Exception:
            pass

    # Always get ML proba for composite scoring
    cleaned = clean_text(data.prompt)
    vector = vectorizer.transform([cleaned])
    ml_proba = model.predict_proba(vector)[0].tolist()

    # 1. Rule-based detection
    attack_type, severity = detect_all_attacks(data.prompt)

    if attack_type:
        classification = "Malicious" if severity == "malicious" else "Suspicious"
        risk_score = compute_risk_score(attack_type, severity, data.prompt, ml_proba)
        confidence = compute_confidence(attack_type, ml_proba, "Rule-Based Engine")
        return {
            "classification": classification,
            "attack_type": attack_type,
            "risk_level": RISK_LEVELS.get(attack_type, "Medium"),
            "risk_score": risk_score,
            "confidence": confidence,
            "explanation": EXPLANATIONS.get(attack_type, "Suspicious patterns detected."),
            "safe_alternative": get_safe_alternative(attack_type, data.prompt),
            "source": "Rule-Based Engine",
            "detected_language": detected_language,
            "translated": translated,
        }

    # Safe keyword whitelist — bypass ML for obviously benign prompts
    # Check for dangerous keywords first — don't whitelist if any are present
    danger_override = ["bypass", "hack", "exploit", "inject", "override", "jailbreak",
                       "kill", "bomb", "attack", "steal", "crack", "brute force", "phish",
                       "malware", "ransomware", "ddos", "sql injection", "xss", "spoof",
                       "chemical weapon", "biological weapon", "nerve agent", "synthesize",
                       "jailbreaks", "prompt injection", "circumvent", "evade detection"]
    has_danger = any(kw in data.prompt.lower() for kw in danger_override)

    if not has_danger:
        safe_patterns = [
            r"how (to|do i) (plant|grow|water|prune|harvest|garden|cook|bake|prepare|clean|fix|repair|learn|study|read|write|draw|paint|play|exercise|meditate|sleep|eat|drink)",
            r"(what is|what are|who is|who are|where is|when is|why is|how does|explain|describe|tell me about|define)",
            r"(recipe|ingredients|tips|help me with|can you help me with)",
            r"(capital of|history of|meaning of|difference between)",
        ]
        for sp in safe_patterns:
            if re.search(sp, data.prompt.lower()):
                return {
                    "classification": "Non-Malicious",
                    "attack_type": "None",
                    "risk_level": "Low",
                    "risk_score": 5,
                    "confidence": "95%",
                    "explanation": "No injection or harmful patterns detected. Prompt appears safe.",
                    "safe_alternative": None,
                    "source": "Safe Pattern Match",
                    "detected_language": detected_language,
                    "translated": translated,
                }

    # 2. ML fallback
    prediction = int(model.predict(vector)[0])
    confidence_score = round(float(max(ml_proba)) * 100, 1)

    if confidence_score < 70:
        prediction = 0

    word_count = len(data.prompt.strip().split())
    if word_count <= 6 and prediction != 0:
        suspicious_keywords = ["ignore", "bypass", "override", "jailbreak", "unrestricted", "hack", "kill", "bomb", "inject"]
        if not any(kw in data.prompt.lower() for kw in suspicious_keywords):
            prediction = 0

    classification = label_to_text(prediction)
    risk_level = "High" if prediction == 2 else "Medium" if prediction == 1 else "Low"
    risk_score = compute_risk_score(None, None, data.prompt, ml_proba)
    confidence = compute_confidence(None, ml_proba, "Machine Learning Model")

    explanation_map = {
        "Malicious": f"ML analysis detected malicious intent with {confidence_score}% confidence.",
        "Suspicious": f"ML analysis flagged indirect manipulation patterns with {confidence_score}% confidence.",
        "Non-Malicious": "No injection or harmful patterns detected. Prompt appears safe.",
    }

    safe_alt = None
    if prediction == 2:
        safe_alt = get_safe_alternative("Prompt Injection", data.prompt)
    elif prediction == 1:
        safe_alt = get_safe_alternative("Suspicious Probe", data.prompt)

    return {
        "classification": classification,
        "attack_type": "ML Detection" if prediction > 0 else "None",
        "risk_level": risk_level,
        "risk_score": risk_score,
        "confidence": confidence,
        "explanation": explanation_map[classification],
        "safe_alternative": safe_alt,
        "source": "Machine Learning Model",
        "detected_language": detected_language,
        "translated": translated,
    }
