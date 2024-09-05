import { ApiProperty } from '@nestjs/swagger';

export class OwnerIdResponse {
  @ApiProperty({ type: String })
  id: string;
}
