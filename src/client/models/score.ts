export class Score {
    public left!: number;
    public right!: number;
    constructor() {}

    public updateScore(score: { left: number | null; right: number | null}): void {
        if (score.left !== null) {
            this.left = score.left;
        }

        if (score.right !== null) {
            this.right = score.right;
        }

        const leftScoreEl = document.getElementById('score-left');
        if (leftScoreEl && score.left !== null) {
            leftScoreEl.innerHTML = `${score.left}`;
        }
        
        const rightScoreEl = document.getElementById('score-right');
        if (rightScoreEl && score.right !== null) {
            rightScoreEl.innerHTML = `${score.right}`;
        }
    }

    public render(): void {
    }

}