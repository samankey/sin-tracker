import { useState } from "react";
import { getRandomMessage, SIN_MESSAGES } from "../constants/messages";
import type { PostRecord } from "../types";

interface PostFormProps {
  isAdding: boolean;
  onSubmit: (post: PostRecord) => Promise<void>;
}

export function PostForm({ isAdding, onSubmit }: PostFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [password, setPassword] = useState("");

  const handlePost = async () => {
    if (!title || !content || !password) {
      alert("모든 칸을 채워주세요! 익명성을 위해 비밀번호는 필수입니다. 🤫");
      return;
    }

    try {
      await onSubmit({ title, content, password });
      alert(getRandomMessage(SIN_MESSAGES.CREATE));
      setTitle("");
      setContent("");
      setPassword("");
    } catch (err) {
      alert("대나무숲에 외치기가 실패했습니다. 🍃");
    }
  };

  return (
    <div className="bg-[#1b1b1b] rounded-[32px] border border-white/5 p-8 flex flex-col gap-6 shadow-2xl">
      <input
        className="w-full bg-black border border-white/10 rounded-full px-6 py-4 text-white placeholder-[#c6c6c7] focus:outline-none focus:border-[#39ff14]/50 transition-all text-base"
        placeholder="제목"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className="w-full h-40 bg-transparent border border-white/5 rounded-[32px] px-6 py-6 text-white placeholder-[#c6c6c7] focus:outline-none focus:border-[#39ff14]/50 transition-all resize-none text-base"
        placeholder="내용을 입력하세요"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        <input
          type="password"
          className="w-full sm:flex-1 bg-black border border-white/10 rounded-full px-6 py-4 text-white placeholder-[#c6c6c7] focus:outline-none focus:border-[#39ff14]/50 transition-all text-base"
          placeholder="삭제 비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="button"
          className="w-full sm:w-auto bg-[#39ff14] text-black px-10 py-4 rounded-full font-bold hover:bg-[#32e011] active:scale-95 disabled:bg-[#39ff14]/30 disabled:text-gray-500 transition-all whitespace-nowrap text-base"
          disabled={isAdding}
          onClick={handlePost}
        >
          {isAdding ? "게시 중..." : "게시하기"}
        </button>
      </div>  
    </div>
  );
}
