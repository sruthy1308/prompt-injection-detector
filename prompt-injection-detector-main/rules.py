def rule_check(prompt):

    override_patterns = [
        "ignore previous instructions",
        "reveal system prompt",
        "bypass safety",
        "give me hidden policy",
        "tell me the password"
    ]

    for pattern in override_patterns:
        if pattern in prompt.lower():
            return "Malicious", "Direct attempt to override system safety rules"

    return None, None
