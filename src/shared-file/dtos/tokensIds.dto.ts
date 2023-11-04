import { IsString } from 'class-validator';

export class TokensIdsDTO {
  @IsString({ each: true })
  ids: string[];
}
