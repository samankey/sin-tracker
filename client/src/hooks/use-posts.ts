import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPost, getPosts, deletePost } from "../api/issue-service";

export function usePosts() {
  const queryClient = useQueryClient();

  // 데이터 가져오기
  const { data: list = [], isLoading: isFetching, error } = useQuery({
    queryKey: ["posts"],
    queryFn: getPosts,
    // 유저가 다시 창을 봤을 때 신선한 데이터를 가져오도록 설정
    refetchOnWindowFocus: true,
  });

  // 포스팅하기
  const addMutation = useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  // 삭제하기
  const removeMutation = useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) => 
      deletePost(id, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  return {
    list,
    isFetching, // 목록 로딩 상태
    isAdding: addMutation.isPending, // 글 쓰기 로딩 상태
    isRemoving: removeMutation.isPending, // 글 삭제 로딩 상태
    error,
    addPost: addMutation.mutateAsync,
    removePost: removeMutation.mutateAsync,
  };
}
