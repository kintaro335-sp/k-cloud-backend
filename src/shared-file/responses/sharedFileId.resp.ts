import { ApiProperty } from '@nestjs/swagger';

export class SharedFileIdResp {
  @ApiProperty()
  id: string;
}
