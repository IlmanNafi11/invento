export interface ProjectMetadata {
  nama_project: string;
  kategori: 'website' | 'mobile' | 'iot' | 'machine_learning' | 'deep_learning';
  semester: number;
  filename: string;
  filetype: string;
}

export interface ModulMetadata {
  nama_file: string;
  tipe: 'docx' | 'xlsx' | 'pdf' | 'pptx';
  semester: number;
}

export type TUSMetadata = ProjectMetadata | ModulMetadata;

export interface MetadataValidationError {
  field: string;
  message: string;
}

export class TUSMetadataEncoder {
  static encodeValue(value: string): string {
    return btoa(unescape(encodeURIComponent(value)));
  }

  static decodeValue(encodedValue: string): string {
    return decodeURIComponent(escape(atob(encodedValue)));
  }

  static encodeProjectMetadata(metadata: ProjectMetadata): string {
    const pairs: string[] = [];

    if (metadata.nama_project) {
      pairs.push(`nama_project ${this.encodeValue(metadata.nama_project)}`);
    }
    if (metadata.kategori) {
      pairs.push(`kategori ${this.encodeValue(metadata.kategori)}`);
    }
    if (metadata.semester !== undefined) {
      pairs.push(`semester ${this.encodeValue(metadata.semester.toString())}`);
    }
    if (metadata.filename) {
      pairs.push(`filename ${this.encodeValue(metadata.filename)}`);
    }
    if (metadata.filetype) {
      pairs.push(`filetype ${this.encodeValue(metadata.filetype)}`);
    }

    return pairs.join(',');
  }

  static encodeModulMetadata(metadata: ModulMetadata): string {
    const pairs: string[] = [];

    if (metadata.nama_file) {
      pairs.push(`nama_file ${this.encodeValue(metadata.nama_file)}`);
    }
    if (metadata.tipe) {
      pairs.push(`tipe ${this.encodeValue(metadata.tipe)}`);
    }
    if (metadata.semester !== undefined) {
      pairs.push(`semester ${this.encodeValue(metadata.semester.toString())}`);
    }

    return pairs.join(',');
  }

  static encodeMetadata(metadata: TUSMetadata, type: 'project' | 'modul'): string {
    if (type === 'modul') {
      return this.encodeModulMetadata(metadata as ModulMetadata);
    }
    return this.encodeProjectMetadata(metadata as ProjectMetadata);
  }

  static decodeMetadata(encodedMetadata: string): Record<string, string> {
    if (!encodedMetadata || encodedMetadata.trim() === '') {
      return {};
    }

    const result: Record<string, string> = {};
    const pairs = encodedMetadata.split(',');

    for (const pair of pairs) {
      const trimmedPair = pair.trim();
      const spaceIndex = trimmedPair.indexOf(' ');

      if (spaceIndex === -1) {
        continue;
      }

      const key = trimmedPair.substring(0, spaceIndex);
      const encodedValue = trimmedPair.substring(spaceIndex + 1);

      try {
        result[key] = this.decodeValue(encodedValue);
      } catch {
        continue;
      }
    }

    return result;
  }
}

export class TUSMetadataValidator {
  private static readonly VALID_KATEGORI = ['website', 'mobile', 'iot', 'machine_learning', 'deep_learning'];
  private static readonly VALID_TIPE = ['docx', 'xlsx', 'pdf', 'pptx'];

  static validateProjectMetadata(metadata: Partial<ProjectMetadata>): MetadataValidationError[] {
    const errors: MetadataValidationError[] = [];

    if (!metadata.nama_project) {
      errors.push({ field: 'nama_project', message: 'Nama project wajib diisi' });
    } else if (metadata.nama_project.length < 3) {
      errors.push({ field: 'nama_project', message: 'Nama project minimal 3 karakter' });
    } else if (metadata.nama_project.length > 255) {
      errors.push({ field: 'nama_project', message: 'Nama project maksimal 255 karakter' });
    }

    if (!metadata.kategori) {
      errors.push({ field: 'kategori', message: 'Kategori wajib diisi' });
    } else if (!this.VALID_KATEGORI.includes(metadata.kategori)) {
      errors.push({ 
        field: 'kategori', 
        message: `Kategori harus salah satu dari: ${this.VALID_KATEGORI.join(', ')}` 
      });
    }

    if (metadata.semester === undefined || metadata.semester === null) {
      errors.push({ field: 'semester', message: 'Semester wajib diisi' });
    } else if (metadata.semester < 1 || metadata.semester > 8) {
      errors.push({ field: 'semester', message: 'Semester harus antara 1-8' });
    }

    return errors;
  }

  static validateModulMetadata(metadata: Partial<ModulMetadata>): MetadataValidationError[] {
    const errors: MetadataValidationError[] = [];

    if (!metadata.nama_file) {
      errors.push({ field: 'nama_file', message: 'Nama file wajib diisi' });
    } else if (metadata.nama_file.length < 3) {
      errors.push({ field: 'nama_file', message: 'Nama file minimal 3 karakter' });
    } else if (metadata.nama_file.length > 255) {
      errors.push({ field: 'nama_file', message: 'Nama file maksimal 255 karakter' });
    }

    if (!metadata.tipe) {
      errors.push({ field: 'tipe', message: 'Tipe file wajib diisi' });
    } else if (!this.VALID_TIPE.includes(metadata.tipe)) {
      errors.push({ 
        field: 'tipe', 
        message: `Tipe file harus salah satu dari: ${this.VALID_TIPE.join(', ')}` 
      });
    }

    if (metadata.semester === undefined || metadata.semester === null) {
      errors.push({ field: 'semester', message: 'Semester wajib diisi' });
    } else if (metadata.semester < 1 || metadata.semester > 8) {
      errors.push({ field: 'semester', message: 'Semester harus antara 1-8' });
    }

    return errors;
  }

  static validateMetadata(metadata: TUSMetadata, type: 'project' | 'modul'): MetadataValidationError[] {
    if (type === 'modul') {
      return this.validateModulMetadata(metadata as ModulMetadata);
    }
    return this.validateProjectMetadata(metadata as ProjectMetadata);
  }

  static isValidProjectMetadata(metadata: Partial<ProjectMetadata>): boolean {
    return this.validateProjectMetadata(metadata).length === 0;
  }

  static isValidModulMetadata(metadata: Partial<ModulMetadata>): boolean {
    return this.validateModulMetadata(metadata).length === 0;
  }
}
