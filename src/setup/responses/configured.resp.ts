import { IsBoolean } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class ConfiguredResponse {
  @ApiProperty({ type: Boolean })
  @IsBoolean()
  configured: boolean
}
