import { ApiProperty } from '@nestjs/swagger';

export class PagesTokensResp {
  @ApiProperty({ type: Number })
  pages: number
}
