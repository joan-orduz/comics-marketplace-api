import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../users/entities/user.entity';

// createParamDecorator crea un decorador de parámetro personalizado
export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // Si se pasa una propiedad, retorna solo esa propiedad
    // @CurrentUser('id') → retorna solo el ID
    // @CurrentUser()    → retorna el usuario completo
    return data ? user?.[data] : user;
  },
);
