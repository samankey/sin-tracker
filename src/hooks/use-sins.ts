import { useCallback, useEffect, useState } from "react";
import { createSin, deleteSin, getSins, updateSin } from "../api/issue-service";
import type { SinRecord } from "../types";

export function useSins() {
	const [list, setList] = useState<SinRecord[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	const refresh = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const data = await getSins();
			setList(data);
		} catch (err) {
			setError(err instanceof Error ? err : new Error("데이터 로드 실패"));
		} finally {
			setIsLoading(false);
		}
	}, []);

	const addSin = async (newRecord: SinRecord) => {
		setIsLoading(true);

		// 낙관적 업데이트
		const previousList = [...list];
		const optimisticSin = { ...newRecord, id: Date.now() };
		setList((prev) => [optimisticSin, ...prev]);
		try {
			await createSin(newRecord);
			await refresh();
		} catch (err) {
			setList(previousList);
			alert("기록에 실패했습니다. 하늘이 당신을 굽어살피나 봅니다.");
		} finally {
			setIsLoading(false);
		}
	};

	const modifySin = async (id: number, record: SinRecord) => {
		setIsLoading(true);
		try {
			await updateSin(id, record);
			await refresh();
		} finally {
			setIsLoading(false);
		}
	};

	const removeSin = async (id: number) => {
		setIsLoading(true);

		// 낙관적 업데이트
		const previousList = [...list];
		setList((prev) => prev.filter((item) => item.id !== id));
		try {
			await deleteSin(id);
			await refresh();
		} catch (err) {
			setList(previousList);
			alert("과거 세탁에 실패했습니다. 증거가 아직 남아있네요...");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		refresh();
	}, [refresh]);

	return {
		list,
		isLoading,
		error,
		addSin,
		modifySin,
		removeSin,
		refresh,
	};
}
