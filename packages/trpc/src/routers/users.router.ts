import { z } from 'zod';
import { UsersService } from '../services/users.service';
import { protectedProcedure, router } from '../trpc';

export const usersRouter = router({
  updateProfile: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(100) }))
    .mutation(({ ctx, input }) =>
      new UsersService(ctx.prisma).updateProfile(ctx.userId, input.name),
    ),

  deleteAccount: protectedProcedure.mutation(({ ctx }) =>
    new UsersService(ctx.prisma).deleteAccount(ctx.userId),
  ),
});
