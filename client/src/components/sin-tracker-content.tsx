import { getRandomMessage, SIN_MESSAGES } from "../constants/messages";
import { useSins } from "../hooks/use-sins";

export function SinTrackerContent() {
  const { list, isLoading, error, addSin, modifySin, removeSin } = useSins();
  const handleAdd = async () => {
    await addSin({
      date: new Date().toISOString().split("T")[0],
      score: 6,
      confession: "9시에 KFC 시킴",
    });
    alert(getRandomMessage(SIN_MESSAGES.CREATE));
  };

  const handleUpdate = async (id: number) => {
    const confirmMsg = getRandomMessage(SIN_MESSAGES.UPDATE_CONFIRM);
    if (confirm(confirmMsg)) {
      await modifySin(id, {
        date: new Date().toISOString().split("T")[0],
        score: 50,
        confession: "KFC 대신 샐러드 먹을걸...",
      });
      alert(getRandomMessage(SIN_MESSAGES.UPDATE_SUCCESS));
    }
  };

  const handleDelete = async (id: number) => {
    const confirmMsg = getRandomMessage(SIN_MESSAGES.DELETE_CONFIRM);
    if (confirm(confirmMsg)) {
      await removeSin(id);
      alert(getRandomMessage(SIN_MESSAGES.DELETE_SUCCESS));
    }
  };

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold">😈</h1>
      <button
        type="button"
        className="bg-red-500 text-white p-2 m-2"
        disabled={isLoading}
        onClick={handleAdd}
      >
        {isLoading ? "죄 짓는 중..." : "죄 짓기"}
      </button>
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm flex items-center gap-2">
          <span>⚠️</span>
          {error.message}
        </div>
      )}
      <h2 className="text-xl font-semibold mb-2">죄 목록</h2>
      {isLoading && <p>데이터를 불러오는 중입니다...</p>}

      <div className="space-y-4">
        {list.map((sin) => (
          <div
            key={sin.id}
            className="p-4 border rounded-xl bg-gray-50 flex justify-between items-center"
          >
            <div className="flex flex-col items-start">
              <p className="font-mono text-sm">{sin.date}</p>
              <p className="font-mono text-sm">{sin.confession}</p>
              <p className="font-mono text-sm">점수: {sin.score}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                onClick={() => sin.id && handleUpdate(sin.id)}
              >
                수정
              </button>
              <button
                type="button"
                className="bg-gray-800 text-white px-3 py-1 rounded text-sm"
                onClick={() => sin.id && handleDelete(sin.id)}
              >
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>
      <details>
        <summary className="cursor-pointer text-gray-400">Raw Data</summary>
        <pre className="bg-gray-100 p-4 mt-2 rounded text-xs">
          {JSON.stringify(list, null, 2)}
        </pre>
      </details>
    </div>
  );
}
