/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  useMutation,
  UseMutationOptions,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';

/**
 * 기본 GoalMutation 훅
 */
export function useGoalMutation<
  TData = unknown,
  TError extends Error = Error,
  TVariables = void,
>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: Omit<UseMutationOptions<TData, TError, TVariables>, 'mutationFn'>
): UseMutationResult<TData, TError, TVariables> {
  return useMutation<TData, TError, TVariables>({
    mutationFn,
    ...options,
  });
}

/**
 * 낙관적 업데이트를 지원하는 mutation 훅
 */
export function useGoalOptimisticMutation<
  TData = unknown,
  TError extends Error = Error,
  TVariables = void,
  TQueryData = unknown,
>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  queryKey: unknown[],
  updateFn: (
    oldData: TQueryData | undefined,
    variables: TVariables
  ) => TQueryData,
  options?: Omit<UseMutationOptions<TData, TError, TVariables>, 'mutationFn'>
): UseMutationResult<TData, TError, TVariables> {
  const queryClient = useQueryClient();
  const { onMutate: userOnMutate, onError: userOnError, onSettled: userOnSettled, ...restOptions } = options ?? {};

  return useMutation<TData, TError, TVariables>({
    mutationFn,
    ...restOptions,
    onMutate: async (variables: TVariables) => {
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<TQueryData>(queryKey);

      if (previousData !== undefined) {
        queryClient.setQueryData(queryKey, updateFn(previousData, variables));
      }

      const userContext = await (userOnMutate as any)?.(variables);
      return { previousData, ...((userContext as object) ?? {}) };
    },
    onError: (err: TError, variables: TVariables, context: any) => {
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      (userOnError as any)?.(err, variables, context);
    },
    onSettled: (data: any, error: any, variables: TVariables, context: any) => {
      queryClient.invalidateQueries({ queryKey });
      (userOnSettled as any)?.(data, error, variables, context);
    },
  } as any);
}

/**
 * 여러 쿼리에 대한 낙관적 업데이트를 지원하는 mutation 훅
 */
export function useGoalMultiOptimisticMutation<
  TData = unknown,
  TError extends Error = Error,
  TVariables = void,
  TQueryData = unknown,
>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  optimisticQueries: Array<{
    queryKey: unknown[];
    updateFn: (
      oldData: TQueryData | undefined,
      variables: TVariables
    ) => TQueryData;
  }>,
  options?: Omit<UseMutationOptions<TData, TError, TVariables>, 'mutationFn'>
): UseMutationResult<TData, TError, TVariables> {
  const queryClient = useQueryClient();
  const { onMutate: userOnMutate, onError: userOnError, onSettled: userOnSettled, ...restOptions } = options ?? {};

  return useMutation<TData, TError, TVariables>({
    mutationFn,
    ...restOptions,
    onMutate: async (variables: TVariables) => {
      await Promise.all(
        optimisticQueries.map(({ queryKey }) =>
          queryClient.cancelQueries({ queryKey })
        )
      );

      const previousDataMap = new Map<string, TQueryData | undefined>();

      optimisticQueries.forEach(({ queryKey, updateFn }) => {
        const queryKeyStr = JSON.stringify(queryKey);
        const previousData = queryClient.getQueryData<TQueryData>(queryKey);
        previousDataMap.set(queryKeyStr, previousData);

        if (previousData !== undefined) {
          queryClient.setQueryData(
            queryKey,
            updateFn(previousData, variables)
          );
        }
      });

      const userContext = await (userOnMutate as any)?.(variables);
      return { previousDataMap, ...((userContext as object) ?? {}) };
    },
    onError: (err: TError, variables: TVariables, context: any) => {
      if (context?.previousDataMap) {
        const previousDataMap = context.previousDataMap as Map<
          string,
          TQueryData | undefined
        >;

        optimisticQueries.forEach(({ queryKey }) => {
          const queryKeyStr = JSON.stringify(queryKey);
          const previousData = previousDataMap.get(queryKeyStr);

          if (previousData !== undefined) {
            queryClient.setQueryData(queryKey, previousData);
          }
        });
      }
      (userOnError as any)?.(err, variables, context);
    },
    onSettled: (data: any, error: any, variables: TVariables, context: any) => {
      optimisticQueries.forEach(({ queryKey }) => {
        queryClient.invalidateQueries({ queryKey });
      });
      (userOnSettled as any)?.(data, error, variables, context);
    },
  } as any);
}
