"""
Generation module — builds the augmented prompt and generates answers.
Supports both local Qwen2.5 model and optional DeepSeek API.
"""

import os
from typing import List, Dict, Optional

from transformers import pipeline


class Generator:
    """
    Handles prompt construction and answer generation.

    Uses Qwen2.5-1.5B-Instruct locally by default (same as the notebook).
    Can optionally use DeepSeek via HuggingFace InferenceClient if HF_TOKEN is set.
    """

    def __init__(self):
        self.model_name = "Qwen/Qwen2.5-0.5B-Instruct"
        self.pipe = None
        self._use_deepseek = bool(os.getenv("HF_TOKEN") and os.getenv("USE_DEEPSEEK", "false").lower() == "true")

        if self._use_deepseek:
            from huggingface_hub import InferenceClient
            self.client = InferenceClient(token=os.getenv("HF_TOKEN"))
            self.deepseek_model = os.getenv("DEEPSEEK_MODEL", "deepseek-ai/DeepSeek-R1")
            print(f"[Generator] Using DeepSeek via API: {self.deepseek_model}")
        else:
            self.pipe = pipeline(
                "text-generation",
                model=self.model_name,
                device_map="auto",
                dtype="auto",
            )
            print(f"[Generator] Using local model: {self.model_name}")

    def build_prompt(self, question: str, retrieved: List[Dict], k: int = 3) -> str:
        """
        Build the augmented prompt with grounding instruction.
        Same structure as the notebook: instruction + context + question.
        """
        hits = retrieved[:k]
        context = ""
        for hit in hits:
            context += f"\n[Source {hit['rank']}: {hit['source']}]\n{hit['chunk']}\n"
        prompt = (
            "Answer the question using ONLY the context below. "
            'If the answer is not in the context, say "I do not know". '
            "Do not guess. Cite the source file for each fact you use.\n"
            f"\nContext:{context}"
            f"\nQuestion: {question}\nAnswer:"
        )
        return prompt

    def generate(self, prompt: str, max_new_tokens: int = 300) -> str:
        """Generate an answer from the augmented prompt."""
        if self._use_deepseek:
            response = self.client.chat_completion(
                model=self.deepseek_model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=max_new_tokens,
                temperature=0.2,
            )
            return response.choices[0].message.content.strip()

        out = self.pipe(
            [{"role": "user", "content": prompt}],
            max_new_tokens=max_new_tokens,
            do_sample=False,
        )
        return out[0]["generated_text"][-1]["content"].strip()

    def generate_stream(self, prompt: str, max_new_tokens: int = 300):
        """
        Generator that yields tokens one at a time for SSE streaming.
        Only works with local model for now.
        """
        if self._use_deepseek:
            # For DeepSeek, fall back to non-streaming
            yield self.generate(prompt, max_new_tokens)
            return

        for chunk in self.pipe(
            [{"role": "user", "content": prompt}],
            max_new_tokens=max_new_tokens,
            do_sample=False,
            return_dict_in_generate=True,
            output_scores=False,
            streamer=None,
        ):
            if isinstance(chunk, list) and len(chunk) > 0:
                text = chunk[0].get("generated_text", "")
                if isinstance(text, list) and len(text) > 0:
                    yield text[-1].get("content", "")
