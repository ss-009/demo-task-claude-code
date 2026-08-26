import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * 外部AI分析APIの仕様に合わせ、ワイヤーフォーマット通り image_path (snake_case) を用いる。
 */
export class CreateAnalysisDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  image_path: string;
}
