import { useCallback, useEffect, useState } from "react";
import { createSin, getSins } from "./api/issue-service";
import type { SinRecord } from "./types";

export default function App() {
	const [list, setList] = useState<SinRecord[]>([]);

	const loadData = useCallback(async () => {
		const data = await getSins();
		setList(data);
	}, []);

	const handleAdd = async () => {
		const newSin = {
			date: new Date().toISOString().split("T")[0],
			score: 6,
			confession: "9시에 KFC 시킴",
		};
		await createSin(newSin);
		alert("죄를 지었습니다");
		loadData();
	};

	useEffect(() => {
		loadData();
	}, [loadData]);

	return (
		<div className="p-10">
			<h1 className="text-2xl font-bold">😈</h1>
			<button
				type="button"
				className="bg-red-500 text-white p-2 m-2"
				onClick={handleAdd}
			>
				내자신 미안해
			</button>
			<pre>{JSON.stringify(list, null, 2)}</pre>
		</div>
	);
}
