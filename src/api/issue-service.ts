import type { SinRecord } from "../types";

const BASE_URL = `https://api.github.com/repos/${import.meta.env.VITE_REPO_OWNER}/${import.meta.env.VITE_REPO_NAME}/issues`;
const HEADERS = {
	Authorization: `token ${import.meta.env.VITE_GITHUB_TOKEN}`,
	"Content-Type": "application/json",
};

/**
 * 생성
 */
export const createSin = async (record: SinRecord) => {
	const response = await fetch(BASE_URL, {
		method: "POST",
		headers: HEADERS,
		body: JSON.stringify({
			title: `[Sin-Log] ${record.date}`,
			body: JSON.stringify(record),
			labels: ["sin-data"],
		}),
	});
	return response.ok;
};

/**
 * 수정
 */
export const updateSin = async (issueNumber: number, record: SinRecord) => {
	const response = await fetch(`${BASE_URL}/${issueNumber}`, {
		method: "PATCH",
		headers: HEADERS,
		body: JSON.stringify({
			title: `[Sin-Log] ${record.date}`,
			body: JSON.stringify(record),
		}),
	});
	return response.ok;
};

/**
 * 읽기
 */
export const getSins = async (): Promise<SinRecord[]> => {
	const response = await fetch(`${BASE_URL}?labels=sin-data&state=open`, {
		headers: HEADERS,
	});
	const issues = await response.json();

	return issues.map((issue: any) => ({
		...JSON.parse(issue.body),
		id: issue.number,
	}));
};

/**
 * 삭제
 */
export const deleteSin = async (issueNumber: number) => {
	const response = await fetch(`${BASE_URL}/${issueNumber}`, {
		method: "PATCH",
		headers: HEADERS,
		body: JSON.stringify({
			state: "closed",
		}),
	});
	return response.ok;
};
