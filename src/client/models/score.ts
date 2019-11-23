export class Score {
    private left: number;
    private right: number;
    constructor(left: number, right: number) {
        this.left = left;
        this.right = right;
        this.updateScore({left: this.left, right:this.right});
    }

    public updateScore(score: {left?: number; right?: number}): void {
        if (score.left !== void 0) {
            this.left = score.left;
        }

        if (score.right !== void 0) {
            this.right = score.right;
        }

        const leftScoreEl = document.getElementById('score-left');
        if (leftScoreEl && score.left !== void 0) {
            leftScoreEl.innerHTML = `${score.left}`;
        }
        
        const rightScoreEl = document.getElementById('score-right');
        if (rightScoreEl && score.right !== void 0) {
            rightScoreEl.innerHTML = `${score.right}`;
        }
    }
}