import type { SinRecord } from "../types";

const BASE_URL = `https://api.github.com/repos/${import.meta.env.VITE_REPO_OWNER}/${import.meta.env.VITE_REPO_NAME}/issues`;
const HEADERS = {
	Authorization: `token ${import.meta.env.VITE_GITHUB_TOKEN}`,
	"Content-Type": "application/json",
};

/**
 * 기록 생성
 */
export const createSin = async (record: SinRecord) => {
	const response = await fetch(BASE_URL, {
		method: "POST",
		headers: HEADERS,
		body: JSON.stringify({
			title: `[Sin-Log] ${record.date}`,
			// 본문에 JSON 데이터를 숨겨서 저장 (나중에 읽기 위해)
			body: JSON.stringify(record),
			labels: ["sin-data"], // 데이터 구분을 위한 라벨
		}),
	});
	return response.ok;
};

/**
 * 읽기
 */
export const getSins = async (): Promise<SinRecord[]> => {
	const response = await fetch(`${BASE_URL}?labels=sin-data&state=all`, {
		headers: HEADERS,
	});
	const issues = await response.json();

	// 이슈 본문에 숨겨진 JSON만 추출해서 배열로 만듦
	return issues.map((issue: any) => JSON.parse(issue.body));
};
