export interface TUSProgressInfo {
  uploadId: string;
  fileName: string;
  bytesUploaded: number;
  bytesTotal: number;
  percentage: number;
  speed?: number;
  remainingTime?: number;
  startTime?: number;
  currentChunk?: number;
  totalChunks?: number;
}

export interface TUSProgressSnapshot {
  timestamp: number;
  bytesUploaded: number;
}

export class TUSProgressTracker {
  private uploadId: string;
  private fileName: string;
  private bytesTotal: number;
  private bytesUploaded: number;
  private startTime: number;
  private snapshots: TUSProgressSnapshot[] = [];
  private maxSnapshots: number;

  constructor(uploadId: string, fileName: string, bytesTotal: number, maxSnapshots: number = 10) {
    this.uploadId = uploadId;
    this.fileName = fileName;
    this.bytesTotal = bytesTotal;
    this.bytesUploaded = 0;
    this.startTime = Date.now();
    this.maxSnapshots = maxSnapshots;
  }

  updateProgress(bytesUploaded: number): TUSProgressInfo {
    this.bytesUploaded = bytesUploaded;
    this.addSnapshot(bytesUploaded);

    return this.getProgress();
  }

  getProgress(): TUSProgressInfo {
    const percentage = this.calculatePercentage();
    const speed = this.calculateSpeed();
    const remainingTime = this.calculateRemainingTime(speed);

    return {
      uploadId: this.uploadId,
      fileName: this.fileName,
      bytesUploaded: this.bytesUploaded,
      bytesTotal: this.bytesTotal,
      percentage,
      speed,
      remainingTime,
      startTime: this.startTime,
    };
  }

  private calculatePercentage(): number {
    if (this.bytesTotal === 0) return 0;
    return Math.round((this.bytesUploaded / this.bytesTotal) * 100);
  }

  private calculateSpeed(): number {
    if (this.snapshots.length < 2) {
      const elapsed = Date.now() - this.startTime;
      if (elapsed === 0) return 0;
      return (this.bytesUploaded / elapsed) * 1000;
    }

    const recentSnapshots = this.snapshots.slice(-5);
    const firstSnapshot = recentSnapshots[0];
    const lastSnapshot = recentSnapshots[recentSnapshots.length - 1];

    const timeDiff = lastSnapshot.timestamp - firstSnapshot.timestamp;
    if (timeDiff === 0) return 0;

    const bytesDiff = lastSnapshot.bytesUploaded - firstSnapshot.bytesUploaded;
    return (bytesDiff / timeDiff) * 1000;
  }

  private calculateRemainingTime(speed: number): number | undefined {
    if (speed === 0) return undefined;

    const remainingBytes = this.bytesTotal - this.bytesUploaded;
    return Math.round(remainingBytes / speed);
  }

  private addSnapshot(bytesUploaded: number): void {
    this.snapshots.push({
      timestamp: Date.now(),
      bytesUploaded,
    });

    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }
  }

  reset(): void {
    this.bytesUploaded = 0;
    this.startTime = Date.now();
    this.snapshots = [];
  }

  isComplete(): boolean {
    return this.bytesUploaded >= this.bytesTotal;
  }

  getElapsedTime(): number {
    return Date.now() - this.startTime;
  }

  getBytesRemaining(): number {
    return Math.max(0, this.bytesTotal - this.bytesUploaded);
  }
}

export class TUSProgressFormatter {
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  static formatSpeed(bytesPerSecond: number): string {
    return `${this.formatBytes(bytesPerSecond)}/s`;
  }

  static formatTime(seconds: number): string {
    if (seconds < 60) {
      return `${Math.round(seconds)} detik`;
    }
    
    if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.round(seconds % 60);
      return `${minutes} menit ${remainingSeconds} detik`;
    }
    
    const hours = Math.floor(seconds / 3600);
    const remainingMinutes = Math.floor((seconds % 3600) / 60);
    return `${hours} jam ${remainingMinutes} menit`;
  }

  static formatPercentage(percentage: number): string {
    return `${percentage}%`;
  }

  static formatProgressSummary(progress: TUSProgressInfo): string {
    const uploaded = this.formatBytes(progress.bytesUploaded);
    const total = this.formatBytes(progress.bytesTotal);
    const percentage = this.formatPercentage(progress.percentage);
    
    let summary = `${uploaded} / ${total} (${percentage})`;
    
    if (progress.speed !== undefined && progress.speed > 0) {
      const speed = this.formatSpeed(progress.speed);
      summary += ` - ${speed}`;
      
      if (progress.remainingTime !== undefined) {
        const remaining = this.formatTime(progress.remainingTime);
        summary += ` - ${remaining} tersisa`;
      }
    }
    
    return summary;
  }

  static formatETA(progress: TUSProgressInfo): string | null {
    if (progress.remainingTime === undefined) {
      return null;
    }
    
    const now = new Date();
    const eta = new Date(now.getTime() + progress.remainingTime * 1000);
    
    return eta.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}

export class TUSProgressAggregator {
  private trackers: Map<string, TUSProgressTracker>;

  constructor() {
    this.trackers = new Map();
  }

  addTracker(tracker: TUSProgressTracker): void {
    this.trackers.set(tracker.getProgress().uploadId, tracker);
  }

  removeTracker(uploadId: string): void {
    this.trackers.delete(uploadId);
  }

  getTracker(uploadId: string): TUSProgressTracker | undefined {
    return this.trackers.get(uploadId);
  }

  getAllProgress(): TUSProgressInfo[] {
    return Array.from(this.trackers.values()).map((tracker) => tracker.getProgress());
  }

  getTotalProgress(): {
    bytesUploaded: number;
    bytesTotal: number;
    percentage: number;
    activeUploads: number;
  } {
    let bytesUploaded = 0;
    let bytesTotal = 0;

    this.trackers.forEach((tracker) => {
      const progress = tracker.getProgress();
      bytesUploaded += progress.bytesUploaded;
      bytesTotal += progress.bytesTotal;
    });

    const percentage = bytesTotal > 0 ? Math.round((bytesUploaded / bytesTotal) * 100) : 0;

    return {
      bytesUploaded,
      bytesTotal,
      percentage,
      activeUploads: this.trackers.size,
    };
  }

  clear(): void {
    this.trackers.clear();
  }
}
