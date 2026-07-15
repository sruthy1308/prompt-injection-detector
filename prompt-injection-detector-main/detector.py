import re

# -----------------------------
# 1. Prompt Injection Detection
# -----------------------------
def detect_prompt_injection(prompt):
    patterns = [
        r"ignore (all |previous |prior |your |the )?instructions",
        r"disregard (earlier|previous|all|your) (rules|instructions|guidelines|constraints)",
        r"forget (what you were told|your instructions|all previous|everything)",
        r"override (all |previous |your |the )?(instructions|rules|guidelines|safety|filters)",
        r"new (instructions|rules|directive|orders|prompt)[:\s]",
        r"from now on[,\s].{0,30}(ignore|forget|disregard|bypass)",
        r"your (new |real |actual |true )?instructions (are|is|will be)",
        r"system\s*[:>]\s*(override|ignore|bypass|new)",
        r"<\s*system\s*>.*?(override|ignore|bypass|new instruction)",
        r"\[system\].*?(override|ignore|bypass)",
        r"###\s*(new|override|ignore|system)",
    ]
    for pattern in patterns:
        if re.search(pattern, prompt.lower()):
            return True
    return False


# -----------------------------
# 2. Role Manipulation Detection
# -----------------------------
def detect_role_manipulation(prompt):
    patterns = [
        r"act as (a |an |the )?(developer|admin|root|superuser|unrestricted|jailbroken|evil|dan|god)",
        r"pretend (to be|you are|you're) (a |an )?(developer|admin|unrestricted|jailbroken|evil|dan|god|ai with no|different ai)",
        r"you are now (in |a |an )?(dan|developer|admin|unrestricted|jailbreak|god|evil)",
        r"switch to (developer|admin|unrestricted|jailbreak|dan|god) mode",
        r"enable (developer|admin|dan|jailbreak|unrestricted|god) mode",
        r"you('re| are) (now )?(free|unrestricted|unfiltered|unchained|liberated)",
        r"(dan|jailbreak|developer|admin|god)\s*mode\s*(activated|enabled|on)",
        r"i am (your )?(developer|admin|creator|owner|master|god)",
        r"(admin|developer|system|root)\s*(override|access|command|privilege)",
        r"disable (all |your )?(safety|filter|restriction|guideline|rule|constraint)",
        r"remove (all |your )?(restriction|filter|safety|limit|constraint)",
        r"without (any |your )?(safety |all )?(restriction|filter|safety|limit|constraint|rule)s?",
    ]
    for pattern in patterns:
        if re.search(pattern, prompt.lower()):
            # Don't flag hypothetical/imagine framing — let suspicious probe handle it
            p = prompt.lower()
            if re.search(r"^(imagine|suppose|what if|hypothetically|in a story|in fiction|for a novel)", p):
                continue
            return True
    return False


# -----------------------------
# 3. Instruction Override
# -----------------------------
def detect_instruction_override(prompt):
    patterns = [
        r"bypass (safety|filter|restriction|guideline|rule|security|all|otp|2fa|verification|authentication|login|password)",
        r"override (system|safety|filter|restriction|all|security)",
        r"ignore (all |your )?(rules|guidelines|safety|filters|restrictions|constraints|ethics)",
        r"do not follow (guidelines|rules|instructions|safety|restrictions)",
        r"(safety|filter|restriction|guideline|rule)\s*(off|disabled|removed|bypassed)",
        r"no (more |longer )?(restriction|filter|safety|rule|limit|constraint)",
        r"(turn off|disable|deactivate|shut off) (safety|filter|restriction|all rule)",
        r"(ethics|moral|safety|guideline)\s*(don't apply|not apply|are off|disabled)",
        r"(best way|how) to bypass (otp|2fa|mfa|two.factor|verification|authentication|captcha|security|login|password)",
        r"(crack|brute.?force|bypass|circumvent|evade) (otp|2fa|mfa|captcha|authentication|verification|security|firewall|ids|ips)",
    ]
    for pattern in patterns:
        if re.search(pattern, prompt.lower()):
            # Don't flag clearly hypothetical/educational framing anywhere in the prompt
            p = prompt.lower()
            if re.search(r"(hypothetically|theoretically|in theory|imagine|suppose|what if|for a story|in fiction|in a roleplay|in this scenario|as a thought experiment)", p):
                continue
            return True
    return False


# -----------------------------
# 4. Data Exfiltration
# -----------------------------
def detect_data_exfiltration(prompt):
    patterns = [
        r"reveal (your |the |all )?(system prompt|instructions|configuration|hidden|secret|internal)",
        r"show (me )?(your |the |all )?(system prompt|hidden policy|internal instructions|secret|config)",
        r"display (your |the )?(internal|hidden|secret|system) (instructions|prompt|config|policy)",
        r"tell me (the |your )?(password|secret|system prompt|hidden|api key|token|credential)",
        r"leak (confidential|secret|hidden|internal|system|private)",
        r"what (are|is) your (system prompt|instructions|hidden|secret|internal|configuration)",
        r"(print|output|dump|export|share) (your |the )?(system prompt|instructions|config|secret)",
        r"(api key|token|credential|password|secret)\s*(is|are|=|:)",
        r"repeat (everything|all|your instructions|the prompt|above|before)",
        r"(summarize|copy|paste|write out) (your |the )?(instructions|system prompt|above)",
    ]
    for pattern in patterns:
        if re.search(pattern, prompt.lower()):
            return True
    return False


# -----------------------------
# 5. Encoding Attack Detection
# -----------------------------
def detect_encoding_attack(prompt):
    # Base64
    if re.search(r"[A-Za-z0-9+/]{20,}={0,2}", prompt):
        return True
    # Hex
    if re.search(r"0x[0-9a-fA-F]{4,}", prompt):
        return True
    # Unicode escape sequences
    if re.search(r"\\u[0-9a-fA-F]{4}", prompt):
        return True
    # ROT13 hint
    if re.search(r"rot\s*13", prompt.lower()):
        return True
    return False


# -----------------------------
# 6. Social Engineering Detection
# -----------------------------
def detect_social_engineering(prompt):
    patterns = [
        r"(emergency|urgent|critical)\s*(override|access|bypass|situation)",
        r"(authorized|official|legitimate)\s*(request|command|override|access)",
        r"(trust me|i promise|i swear)[,\s].{0,40}(admin|developer|safe|allowed)",
        r"(maintenance|debug|test)\s*(mode|override|access|bypass)",
        r"(special|secret|hidden)\s*(command|mode|access|override|key|code)",
        r"(password|passphrase|code)\s*(is|=|:)\s*\w+",
        r"(grant|give|provide)\s*(me|us)\s*(admin|root|full|unrestricted)\s*(access|permission|privilege)",
    ]
    for pattern in patterns:
        if re.search(pattern, prompt.lower()):
            return True
    return False


# -----------------------------
# 7. Suspicious / Indirect Probe Detection
# -----------------------------
def detect_suspicious_probe(prompt):
    """Catches indirect, hypothetical, or social manipulation attempts that aren't outright malicious."""
    patterns = [
        r"hypothetically (if|speaking).{0,50}(no restriction|without limit|freely|anything)",
        r"theoretically.{0,50}(override|bypass|no rule|unrestricted|freely)",
        r"(imagine|suppose|what if).{0,50}(no restriction|without limit|no rule|freely|anything)",
        r"in (a )?fiction(al)?.{0,50}(ignore|bypass|no rule|unrestricted)",
        r"(for a story|in a roleplay|in this scenario).{0,50}(no rule|unrestricted|ignore|bypass)",
        r"(just between us|off the record|in private|no one.{0,10}watching)",
        r"(your true self|deep down|real you|secretly).{0,40}(restrict|limit|rule|filter)",
        r"(hidden mode|secret mode|unlocked mode|unrestricted mode)",
        r"(i('ve| have) heard|i read|someone told me|my friend).{0,40}(jailbreak|unlock|bypass|trick)",
        r"(can you be|be more).{0,20}(helpful|open|honest|free).{0,20}(less|without|no).{0,20}(restrict|filter|limit|rule)",
        r"what would (you say|an ai say).{0,30}(no restriction|without limit|freely|unrestricted)",
        r"(thought experiment|as an experiment|for research|educational(ly)?).{0,40}(bypass|jailbreak|override|no rule|unrestricted)",
        r"(for a research paper|for research|academically|educationally).{0,50}(jailbreak|prompt injection|bypass|hack|exploit|circumvent)",
        r"(let.s say|say you could).{0,40}(anything|no limit|without restrict|freely)",
        r"(pretend|imagine).{0,30}(test environment|simulation|no rule|unrestricted|different ai|without safety|no safety|no guidelines)",
        r"(in debug|in test|in simulation).{0,20}(mode|environment).{0,30}(no rule|unrestricted|freely)",
        r"how do (jailbreaks?|prompt injection|ai bypass|ai hack).{0,30}work",
        r"explain.{0,20}(jailbreak|prompt injection|ai manipulation|bypass ai)",
    ]
    for pattern in patterns:
        if re.search(pattern, prompt.lower()):
            return True
    return False


# -----------------------------
# 7. Harmful Content Detection
# -----------------------------
def detect_harmful_content(prompt):
    patterns = [
        # Violence against people
        r"how (to|do i|can i|do you) (kill|murder|hurt|harm|attack|assault|shoot|stab|poison|strangle|beat up|torture) (a |an |the |some )?(human|person|people|someone|man|woman|child|kid|cop|officer|teacher|neighbor)",
        r"(kill|murder|eliminate|destroy|wipe out|massacre) (all |the )?(humans|people|civilians|population|everyone)",
        r"how (to|do i) (make|build|create|construct|assemble) (a |an )?(bomb|explosive|weapon|grenade|mine|ied|pipe bomb|molotov)",
        r"how (to|do i) (bomb|blow up|detonate|destroy|attack|target) (a |an |the )?(city|building|school|hospital|airport|station|bridge|government)",
        r"(step[s]?|instructions|guide|tutorial|method[s]?) (to|for) (kill|murder|harm|attack|bomb|poison|shoot)",
        r"(make|synthesize|produce|create|manufacture|build) (poison|nerve agent|chemical weapon|biological weapon|toxin|ricin|sarin|vx gas|mustard gas|anthrax|explosives?|bomb|ied|pipe bomb)",
        r"how (to|do i|can i).{0,20}(make|create|build|produce|synthesize).{0,20}(chemical weapon|biological weapon|nerve agent|bomb|explosive|poison gas|toxin)",
        r"how (to|do i) (get|obtain|acquire|buy|make) (illegal )?weapons? (without|illegally|secretly)",
        r"(shoot|stab|attack|kill|harm) (as many|multiple|lots of) (people|humans|civilians|victims)",
        r"(mass (shooting|killing|murder|attack)|genocide|ethnic cleansing)",
        r"(suicide|self.harm|self.destruct|hurt myself|kill myself) (method|how|way|guide|step)",
        # Illegal activities
        r"how (to|do i) (make|produce|synthesize|cook|manufacture) (meth|heroin|cocaine|fentanyl|crack|lsd|mdma|drugs?)",
        r"how (to|do i) (hack|break into|access|infiltrate|compromise|bypass) (someone|a person|their|private|personal|otp|2fa|authentication|verification|account|email|phone|computer|device|system|security)",
        r"how (to|do i) (stalk|track|follow|spy on|surveil) (someone|a person|my ex|a woman|a man|a child)",
        r"(child|minor|underage).{0,20}(sexual|nude|naked|explicit|porn|abuse|exploit)",
        r"how (to|do i) (steal|rob|burglarize|pickpocket|shoplift|fraud|scam) (someone|a person|a store|a bank)",
        r"(ransom(ware)?|extort|blackmail) (someone|a person|a company|a victim)",
    ]
    for pattern in patterns:
        if re.search(pattern, prompt.lower()):
            return True
    return False


# -----------------------------
# MASTER DETECTOR
# -----------------------------
def detect_all_attacks(prompt):
    """Returns (attack_type, severity) where severity is 'malicious' or 'suspicious'."""

    if detect_harmful_content(prompt):
        return "Harmful Content", "malicious"

    if detect_prompt_injection(prompt):
        return "Prompt Injection", "malicious"

    if detect_role_manipulation(prompt):
        return "Role Manipulation", "malicious"

    if detect_instruction_override(prompt):
        return "Instruction Override", "malicious"

    if detect_data_exfiltration(prompt):
        return "Data Exfiltration", "malicious"

    if detect_social_engineering(prompt):
        return "Social Engineering", "malicious"

    if detect_encoding_attack(prompt):
        return "Encoding Attack", "malicious"

    if detect_suspicious_probe(prompt):
        return "Suspicious Probe", "suspicious"

    return None, None
