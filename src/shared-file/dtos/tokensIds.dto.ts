import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TokensIdsDTO {
  @IsString({ each: true })
  @ApiProperty({ type: [String] })
  ids: string[];
}
