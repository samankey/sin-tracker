import type { Issue, SinRecord } from "../types";
import { apiRequest } from "./api-client";

/**
 * 생성
 */
export const createSin = async (record: SinRecord) => {
  return apiRequest("", {
    method: "POST",
    body: JSON.stringify({
      title: `[Sin-Log] ${record.date}`,
      body: JSON.stringify(record),
      labels: ["sin-data"],
    }),
  });
};

/**
 * 수정
 */
export const updateSin = async (issueNumber: number, record: SinRecord) => {
  return apiRequest(String(issueNumber), {
    method: "PATCH",
    body: JSON.stringify({
      title: `[Sin-Log] ${record.date}`,
      body: JSON.stringify(record),
    }),
  });
};

/**
 * 읽기
 */
export const getSins = async (): Promise<SinRecord[]> => {
  const issues = await apiRequest("?labels=sin-data&state=open");

  return issues.map((issue: Issue) => ({
    ...JSON.parse(issue.body),
    id: issue.number,
  }));
};

/**
 * 삭제
 */
export const deleteSin = async (issueNumber: number) => {
  return apiRequest(String(issueNumber), {
    method: "PATCH",
    body: JSON.stringify({
      state: "closed",
    }),
  });
};
