import { SetMetadata } from '@nestjs/common';

export enum Role {
  BUYER  = 'Buyer',
  SELLER = 'Seller',
  ADMIN  = 'Admin',
}

export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
