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

	const addSin = async (record: SinRecord) => {
		setIsLoading(true);
		try {
			await createSin(record);
			await refresh();
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
		try {
			await deleteSin(id);
			await refresh();
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
