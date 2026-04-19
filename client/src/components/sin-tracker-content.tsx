import { useState } from "react";
import { getRandomMessage, SIN_MESSAGES } from "../constants/messages";
import { usePosts } from "../hooks/use-sins";

export function SinTrackerContent() {
  const { list, isLoading, error, addPost, removePost } = usePosts();

  // 1. 입력값 관리를 위한 상태(State)
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [password, setPassword] = useState("");

  const handlePost = async () => {
    if (!title || !content || !password) {
      alert("모든 칸을 채워주세요! 익명성을 위해 비밀번호는 필수입니다. 🤫");
      return;
    }

    // 2. usePosts 훅을 통해 서버로 데이터 전송
    // (usePosts 내부의 addPost가 이제 FastAPI 서버를 바라보게 수정해야 합니다)
    await addPost({
      title,
      content,
      password,
    });

    alert(getRandomMessage(SIN_MESSAGES.CREATE));

    // 3. 입력창 초기화
    setTitle("");
    setContent("");
    setPassword("");
  };

  const handleDelete = async (id: number) => {
    const confirmMsg = getRandomMessage(SIN_MESSAGES.DELETE_CONFIRM);
    if (confirm(confirmMsg)) {
      await removePost(id); // 삭제 시에도 나중에는 비밀번호 검증이 필요하겠네요!
      alert(getRandomMessage(SIN_MESSAGES.DELETE_SUCCESS));
    }
  };

  return (
    <div className="p-10 max-w-2xl mx-auto">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold mb-2">🎭 Anonymous Wood</h1>
        <p className="text-gray-500">
          누구에게도 말 못한 회사 이야기, 여기서 털어놓으세요.
        </p>
      </header>

      {/* 글쓰기 영역 */}
      <div className="flex flex-col gap-4 bg-white p-6 rounded-3xl shadow-lg border border-gray-100 mb-10">
        <input
          className="p-4 border-none bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-green-400 transition-all"
          placeholder="어떤 주제인가요?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="p-4 border-none bg-gray-50 rounded-2xl h-32 outline-none focus:ring-2 focus:ring-green-400 transition-all resize-none"
          placeholder="임금님 귀는 당나귀 귀! 자유롭게 적어주세요."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="flex gap-2">
          <input
            type="password"
            className="flex-1 p-4 border-none bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-green-400 transition-all"
            placeholder="비밀번호 (수정/삭제용)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="bg-green-500 text-white px-8 py-4 rounded-2xl font-bold hover:bg-green-600 active:scale-95 disabled:bg-gray-300 transition-all"
            disabled={isLoading}
            onClick={handlePost}
          >
            {isLoading ? "외치는 중..." : "숲에 외치기"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm flex items-center gap-2">
          <span>⚠️</span> {error.message}
        </div>
      )}

      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        최근 들려온 소식 🍃
      </h2>

      <div className="space-y-4">
        {list.length === 0 && !isLoading && (
          <p className="text-center py-20 text-gray-400 font-medium">
            아직 숲이 고요합니다. 첫 번째 외침을 남겨보세요!
          </p>
        )}

        {list.map((post) => (
          <div
            key={post.id}
            className="p-6 border-none rounded-3xl bg-white shadow-sm flex justify-between items-start hover:shadow-md transition-all border border-gray-50"
          >
            <div className="flex flex-col items-start gap-2">
              <h3 className="font-bold text-lg text-gray-800">{post.title}</h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                {post.content}
              </p>
              <div className="mt-2 flex gap-2">
                <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-mono">
                  #{post.id}
                </span>
                {/* 서버에서 보내주는 익명 ID가 있다면 여기에 표시 */}
              </div>
            </div>
            <button
              type="button"
              className="text-gray-300 hover:text-red-400 p-2 transition-colors"
              onClick={() => post.id && handleDelete(post.id)}
            >
              은폐
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
