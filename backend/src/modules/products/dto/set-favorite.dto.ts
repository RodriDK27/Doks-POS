import { IsBoolean } from 'class-validator';

export class SetFavoriteDto {
  @IsBoolean({ message: 'isFavorite debe ser verdadero o falso' })
  isFavorite: boolean;
}
