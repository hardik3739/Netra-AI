import json
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.nlp_engine import llm_analyze_text_with_phi3


def main():
    text = "Short document text to check compliance risks."
    result = llm_analyze_text_with_phi3(text)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
