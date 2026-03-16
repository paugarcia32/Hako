import { type CreateTRPCReact, createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../server/trpc';

export const trpc: CreateTRPCReact<AppRouter, unknown> = createTRPCReact<AppRouter>();
