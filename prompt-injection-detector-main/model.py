import numpy as np

class EnsembleModel:
    def __init__(self, svc, lr):
        self.svc = svc
        self.lr = lr

    def predict(self, X):
        proba = self.predict_proba(X)
        return np.argmax(proba, axis=1)

    def predict_proba(self, X):
        return (self.svc.predict_proba(X) + self.lr.predict_proba(X)) / 2
