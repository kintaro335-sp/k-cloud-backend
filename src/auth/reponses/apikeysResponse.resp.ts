import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class SessionR {
  @ApiProperty()
  @IsString()
  id: string;
  @ApiProperty()
  @IsString()
  expire: string;
  @ApiProperty()
  @IsString()
  device: string;
}

export class SessionsResponse {
  @ApiProperty({ type: SessionR, isArray: true })
  data: SessionR[];
  @ApiProperty()
  total: number;
}

class ApiKeyR {
  @ApiProperty()
  @IsString()
  id: string;
  @ApiProperty()
  @IsString()
  token: string;
  @ApiProperty()
  @IsString()
  name: string;
}

export class ApiKeysResponse {
  @ApiProperty({ type: ApiKeyR, isArray: true })
  data: ApiKeyR[];
  @ApiProperty()
  total: number;
}
