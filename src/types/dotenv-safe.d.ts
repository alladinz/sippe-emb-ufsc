declare module 'dotenv-safe' {
    import { DotenvConfigOptions, DotenvConfigOutput } from 'dotenv';

    export interface DotenvSafeOptions extends DotenvConfigOptions {
        example?: string;
        allowEmptyValues?: boolean;
    }

    export function config(options?: DotenvSafeOptions): DotenvConfigOutput;
    
    const dotenvSafe: {
        config: typeof config;
    };
    
    export default dotenvSafe;
}
