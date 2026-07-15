import pandas as pd
import pickle
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

print("Loading dataset...")
df = pd.read_csv("../data/final_dataset.csv")

X = df["text"]
y = df["label"]

vectorizer = TfidfVectorizer(ngram_range=(1,2), max_features=5000)
X_vec = vectorizer.fit_transform(X)

model = LogisticRegression(max_iter=200)
model.fit(X_vec, y)

pickle.dump(model, open("model.pkl", "wb"))
pickle.dump(vectorizer, open("vectorizer.pkl", "wb"))

print("Model and vectorizer saved successfully!")
