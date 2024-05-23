class FibonacciTimer {
  private fibSequence: number[] = [0, 1]
  private timerId: NodeJS.Timeout | null = null
  private isTimerRunning: boolean = false

  constructor() {
    this.generateFibonacciSequence(100)
  }

  private generateFibonacciSequence(n: number): void {
    for (let i = 2; i < n; i++) {
      this.fibSequence[i] = this.fibSequence[i - 1] + this.fibSequence[i - 2]
    }
  }

  private fibonacci(n: number): number {
    if (n <= 1) {
      return n
    } else {
      return this.fibSequence[n - 1] + this.fibSequence[n - 2]
    }
  }

  public startTimer(task: () => void, interval: number, n: number): void {
    const executeTask = () => {
      if (this.isTimerRunning) {
        task()
        const fibNumber = this.fibonacci(n)
        this.timerId = setTimeout(executeTask, fibNumber * interval)
      }
    }

    this.isTimerRunning = true
    this.timerId = setTimeout(executeTask, interval)
  }

  public stopTimer(): void {
    this.isTimerRunning = false
    if (this.timerId) {
      clearTimeout(this.timerId)
      this.timerId = null
    }
  }
}

export default FibonacciTimer
