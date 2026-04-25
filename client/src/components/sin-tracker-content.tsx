import { useState } from "react";
import { getRandomMessage, SIN_MESSAGES } from "../constants/messages";
import { usePosts } from "../hooks/use-sins";

export function SinTrackerContent() {
  const { list, isLoading, error, addPost, removePost } = usePosts();

  // 입력값
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [password, setPassword] = useState("");

  // 삭제
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetId, setTargetId] = useState<number | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // 삭제 모달 열기
  const openDeleteModal = (id: number) => {
    setTargetId(id);
    setIsModalOpen(true);
  };

  // 실제 삭제 요청 실행
  const handleConfirmDelete = async (password: string) => {
    if (!targetId || !password) return;

    setIsDeleting(true);
    try {
      await removePost(targetId, password);
      alert(getRandomMessage(SIN_MESSAGES.DELETE_SUCCESS));
      setIsModalOpen(false);
      setDeletePassword("");
    } catch (err: any) {
      // 서버에서 403(비밀번호 불일치) 등이 올 경우 처리
      alert(
        err.response?.data?.detail ||
          "은폐에 실패했습니다. 비밀번호를 확인하세요.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePost = async () => {
    if (!title || !content || !password) {
      alert("모든 칸을 채워주세요! 익명성을 위해 비밀번호는 필수입니다. 🤫");
      return;
    }

    try {
      await addPost({
        title,
        content,
        password,
      });

      alert(getRandomMessage(SIN_MESSAGES.CREATE));

      setTitle("");
      setContent("");
      setPassword("");
    } catch (err) {
      alert("대나무숲에 외치기가 실패했습니다. 🍃");
    }
  };

  const handleDelete = async (id: number) => {
    openDeleteModal(id);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans pb-32">
      {/* Header - TopAppBar Shell */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-black/80 backdrop-blur-xl border-b border-white/10 mb-12">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-wider text-[#a3e635]">
            ANONYMOUS WOOD
          </h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 flex flex-col gap-16">
        {/* Whisper Input: Post Creation Section */}
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
          <div className="flex gap-4 items-center">
            <input
              type="password"
              className="flex-1 bg-black border border-white/10 rounded-full px-6 py-4 text-white placeholder-[#c6c6c7] focus:outline-none focus:border-[#39ff14]/50 transition-all text-base"
              placeholder="삭제 비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="bg-[#39ff14] text-black px-10 py-4 rounded-full font-bold hover:bg-[#32e011] active:scale-95 disabled:bg-[#39ff14]/30 disabled:text-gray-500 transition-all whitespace-nowrap text-base"
              disabled={isLoading}
              onClick={handlePost}
            >
              {isLoading ? "게시 중..." : "게시하기"}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-5 bg-red-900/20 border border-red-500/30 text-red-400 rounded-3xl text-sm flex items-center gap-3">
            <span>⚠️</span> {error.message}
          </div>
        )}

        {/* Feed Section */}
        <div className="flex flex-col gap-8">
          {list.length === 0 && !isLoading && (
            <p className="text-center py-20 text-[#c6c6c7] font-medium">
              아직 숲이 고요합니다. 첫 번째 외침을 남겨보세요!
            </p>
          )}

          {list.map((post) => (
            <div
              key={post.id}
              className="bg-[#1f1f1f] rounded-[48px] border border-white/5 p-8 flex flex-col gap-6 transition-all hover:border-white/10 shadow-lg"
            >
              <div className="flex flex-col gap-4">
                <h3 className="text-lg text-[#e2e2e2] font-medium">
                  {post.title}
                </h3>
                <p className="text-[#badab0] leading-relaxed whitespace-pre-wrap text-base">
                  {post.content}
                </p>
              </div>

              {/* Horizontal Border & Metadata */}
              <div className="border-t border-white/10 pt-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <span className="bg-black/40 border border-white/5 text-[#c6c6c7] px-3 py-1.5 rounded-full text-xs font-mono">
                    ID: 익명_{post.id}
                  </span>
                  <span className="text-[#c6c6c7] text-xs font-medium">
                    익명 게시글
                  </span>
                </div>
                <button
                  type="button"
                  className="text-gray-500 hover:text-red-400 px-2 py-1 transition-colors text-sm font-bold tracking-wide"
                  onClick={() => post.id && handleDelete(post.id)}
                >
                  은폐
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
          <div className="bg-[#1b1b1b] w-full max-w-md rounded-[32px] p-8 border border-[#39ff14]/20 shadow-[0_0_50px_rgba(57,255,20,0.1)]">
            <h2 className="text-2xl font-bold mb-2">정말 은폐할까요?</h2>
            <p className="text-gray-400 mb-6 text-sm">
              작성 시 입력했던 비밀번호를 확인합니다.
            </p>

            <input
              type="password"
              className="w-full bg-black border border-white/10 rounded-full px-6 py-4 text-white focus:outline-none focus:border-[#39ff14] mb-6"
              placeholder="비밀번호 입력"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              autoFocus
            />

            <div className="flex gap-3">
              <button
                className="flex-1 bg-white/5 hover:bg-white/10 text-white py-4 rounded-full font-bold transition-all"
                onClick={() => setIsModalOpen(false)}
              >
                취소
              </button>
              <button
                className="flex-1 bg-[#39ff14] text-black py-4 rounded-full font-bold hover:bg-[#32e011] transition-all disabled:opacity-50"
                onClick={() => handleConfirmDelete(deletePassword)}
                disabled={isDeleting}
              >
                {isDeleting ? "처리 중..." : "확인"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
