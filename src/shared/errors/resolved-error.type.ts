import { ErrorCode } from './error-code.type';

export interface ResolvedError {
  status: number;
  code: ErrorCode;
  message: string | string[];
}
