// Prefer a dedicated backend server; fall back to localhost if not provided.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function buildHeaders(extra: Record<string, string> = {}) {
  const token = import.meta.env.VITE_GITHUB_TOKEN;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `token ${token}` } : {}),
    ...extra,
  };
}

/**
 * 깃허브 전용 에러 객체
 */
export class ApiError extends Error {
  public status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

/**
 * 공통 응답 처리기
 */
async function handleResponse(response: Response) {
  if (!response.ok) {
    // 상황별 에러 메시지
    if (response.status === 401) {
      throw new ApiError(
        401,
        "출입 권한이 거부되었습니다. 통행증(토큰)을 확인해주세요.",
      );
    }
    if (response.status === 403) {
      throw new ApiError(
        403,
        "너무 짧은 시간에 많은 참회를 하셨네요. 잠시 후 다시 시도해주세요.",
      );
    }
    if (response.status === 404) {
      throw new ApiError(
        404,
        "비밀 장부를 찾을 수 없습니다. 경로가 올바른지 확인해주세요.",
      );
    }
    throw new ApiError(
      response.status,
      "시스템에 일시적인 장애가 발생했습니다.",
    );
  }

  // 204 No Content(삭제 등) 대응
  if (response.status === 204) return null;

  return response.json();
}

/**
 * 공통 Fetch 래퍼
 */
export const apiRequest = async (
  endpoint: string = "",
  options: RequestInit = {},
) => {
  const url = endpoint.startsWith("?")
    ? `${BASE_URL}${endpoint}`
    : endpoint
      ? `${BASE_URL}/${endpoint}`
      : BASE_URL;

  console.log("[apiRequest] url:", url);

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers: buildHeaders(options.headers as Record<string, string>),
    });
  } catch (err) {
    console.error("[apiRequest] fetch failed:", err);
    throw new Error(
      "네트워크 요청 실패: " +
        (err instanceof Error ? err.message : String(err)),
    );
  }

  return handleResponse(response);
};
