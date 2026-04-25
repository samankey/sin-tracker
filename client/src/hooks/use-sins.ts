import { useCallback, useEffect, useState } from "react";
import { createPost, getPosts, deletePost } from "../api/issue-service";
import type { PostRecord } from "../types";

export function usePosts() {
  const [list, setList] = useState<PostRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPosts();
      setList(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("목록 로드 실패"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addPost = async (newPost: PostRecord) => {
    setIsLoading(true);
    try {
      await createPost(newPost);
      await refresh(); // 등록 후 목록 갱신
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const removePost = async (id: number, password: string) => {
    setIsLoading(true);
    try {
      await deletePost(id, password);
      await refresh();
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { list, isLoading, error, addPost, removePost, refresh };
}
