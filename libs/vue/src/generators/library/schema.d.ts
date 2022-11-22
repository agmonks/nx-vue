export interface LibraryGeneratorSchema {
  name: string;
  directory?: string;
  skipTsConfig: boolean;
  skipFormat: boolean;
  tags?: string;
  unitTestRunner: 'jest' | 'none';
  publishable: boolean;
  babel: boolean;
}
