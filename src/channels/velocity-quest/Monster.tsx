import styled from '@emotion/styled';
import { MonsterImage } from './MonsterImage';
import { HPBar } from './HPBar';
import sparkleUrl from './assets/vfx/sparkle-sheet.png';
import strkeUrl from './assets/vfx/strike-sheet.png';

const TOP_MARGIN = 32;

const MonsterContainer = styled.div`
    position: absolute;
    top: ${TOP_MARGIN}px;
    right: 2%;
    width: 300px;
    height: 300px;    
`;

const MonsterFrame = styled.div`
  position: relative;
  width: 300px;
  height: 300px;
  margin-top: -20px;
  margin-left: 20px;
`;

const SparkleVfx = styled.div`
    background-image: url(${sparkleUrl});
    background-size: 3636px 226px;
    background-repeat: no-repeat;
    background-position: 0 0;
    width: 280px;
    height: 280px;
    transform: scale(1);
    animation: playSparkle 0.8s steps(12) 1;
    position: absolute;
    top: ${TOP_MARGIN}px;
    z-index: 2;

     @keyframes playSparkle {
        from { background-position: 0 0; }
        to { background-position: -3636px 0; }
    }
`;

const StrikeVfx = styled.div`
    background-image: url(${strkeUrl});
    background-size: cover;
    background-repeat: no-repeat;
    background-position: 0 0;
    width: 280px;
    height: 280px;
    transform: scale(1);
    animation: playStrike 0.5s steps(8) 1;
    position: absolute;
    z-index: 2;

     @keyframes playStrike {
        from { background-position: 0 0; }
        to { background-position: -2240px 0; }
    }
`;

const Label = styled.div`
    font-family: gdqpixel;
    font-size: 24px;
    text-align: center;
`;

export function Monster ({monsterName, onStrikeEnd, onSparkleEnd, monsterState, idleUrl, hurtUrl, showStrike, showSparkle, monsterHP, monsterMaxHP, onHurtAnimationEnd}: {monsterName: string, monsterState: "idle" | "hurt", idleUrl: string, hurtUrl: string, showStrike: boolean, showSparkle: boolean, monsterHP: number, monsterMaxHP: number, onHurtAnimationEnd?: () => void, onStrikeEnd?: () => void, onSparkleEnd?: () => void}) {
    let steps = monsterName == "Run Killer" ? 9 : 3;
    let duration = monsterName == "Run Killer" ? 0.6 : 0.5;
    
    if (monsterHP <= 0) {
        if (monsterName == "Run Killer") {
            steps = 18;
            duration = 2; 
        } else {
            steps = 9;
            duration = 2;
        }
    }
    return (<MonsterContainer>
        <Label>{monsterName}</Label>
        <MonsterFrame>
            {showStrike && <StrikeVfx onAnimationEnd={onStrikeEnd} />}
            {showSparkle && <SparkleVfx onAnimationEnd={onSparkleEnd}/>}
            <MonsterImage state={monsterState} idleUrl={idleUrl} hurtUrl={hurtUrl} onHurtAnimationEnd={onHurtAnimationEnd} 
            hurtDuration={duration} hurtSteps={steps} fullSteps={monsterName == "Run Killer" ? 18 : 9}/>
        </MonsterFrame> 
        <HPBar monsterHP={monsterHP} monsterMaxHP={monsterMaxHP} />
    </MonsterContainer>);
}