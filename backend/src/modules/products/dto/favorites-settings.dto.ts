import { IsInt, Max, Min } from 'class-validator';

export class FavoritesSettingsDto {
  /** Mínimo de ventas (tickets) para que un producto aparezca solo en favoritos; 0 = desactivado */
  @IsInt({ message: 'El mínimo de ventas debe ser un número entero' })
  @Min(0, { message: 'El mínimo de ventas no puede ser negativo' })
  @Max(100000, { message: 'El mínimo de ventas es demasiado grande' })
  autoMinSales: number;
}
