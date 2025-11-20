import type { FormattedDonation, Total, TwitchSubscription } from '@gdq/types/tracker';
import type { MessageQueueItem, Monster } from './types';
import { ChannelProps, registerChannel } from '../channels';
import { useState, useEffect, useRef } from 'react';

import { useListenFor, useReplicant } from 'use-nodecg';
import styled from '@emotion/styled';
import TweenNumber from '@gdq/lib/components/TweenNumber';

import bg from './assets/bg.png';
import hpBarFill from './assets/hpbar_fill.png';
import hpBarTop from './assets/hpbar_top.png';
import hpBar from './assets/hpbar.png';
import nameTriangle from './assets/name_triangle.png';
import textbox from './assets/textbox.png';

import velocity from './assets/velocity/velocity-sheet.png';
import badRngIdle from './assets/bad-rng/bad-rng-idle-all.png';
import badRngHurt from './assets/bad-rng/bad-rng-hurt-sheet.png';
import orbIdle from './assets/orb/orb-idle-all.png';
import orbHurt from './assets/orb/orb-hurt-sheet.png';
import softLockIdle from './assets/softlock/softlock-idle-sheet.png';
import softLockHurt from './assets/softlock/softlock-hurt-sheet.png';

registerChannel('gdq-rpg', 95, GdqRpg, {
	position: 'bottomLeft',
	site: 'Twitch',
	handle: 'PIGSquad',
});

const MESSAGE_DISPLAY_TIME = 3000;

function DonationDialog ({donation}: {donation?: FormattedDonation}) {
    if (!donation) {
        return null; 
    }
    
    return <DonationDialogBox>
        Velocity donated<br/>for {Math.floor(donation.rawAmount)}!
    </DonationDialogBox>
}

function SubscriptionDialog ({subscription}: {subscription?: TwitchSubscription}) {
    if (!subscription) {
        return null; 
    }
    
    return <DonationDialogBox>
        {subscription.display_name}<br/>used Subscribe!
    </DonationDialogBox>
}


const TOP_MARGIN = 32;

const monsters: {[key: string]: Monster} = {
    BadRNG:{
        name: "Bad RNG",
        hurt: badRngHurt,
        idle: badRngIdle,
    },
     Orb: {
        name: "Orb",
        hurt: orbHurt,
        idle: orbIdle,
    },
    Softlock: {
        name: "Softlock",
        hurt: softLockHurt,
        idle: softLockIdle,
    }
}


function GdqRpg(props: ChannelProps) {
	const [total] = useReplicant<Total | null>('total', null);
    const dialogTimerRef = useRef<NodeJS.Timeout | null>(null);
    const messageQueueRef = useRef<Array<MessageQueueItem>>([]);
    const [currentMessage, setCurrentMessage] = useState<MessageQueueItem>();

    const hurtTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [monsterHP, setMonsterHP] = useState<number>(0);
    const [monsterMaxHP, setMonsterMaxHP] = useState<number>(0);
    const [monsterKey, setMonsterKey] = useState<string>("");
    const [monsterState, setMonsterState] = useState<"idle" | "hurt">("idle");
    const [monsterName, setMonsterName] = useState<string>("");
    const victoryTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [showVictoryDialog, setShowVictoryDialog] = useState<boolean>(false);
    const [idleUrl, setIdleUrl] = useState<string>("");
    const [hurtUrl, setHurtUrl] = useState<string>("");
    const [displayTotal, setDisplayTotal] = useState<number>(0);
    
    useEffect(() => {
        if (total == null || displayTotal !== 0) return;
        setDisplayTotal(Math.floor(total?.raw ?? 0));
    }, [total, displayTotal]);
    
    function spawnMonster () {
        const currentMonster = Object.keys(monsters)[Math.floor(Math.random() * Object.keys(monsters).length)];
        
        const randomHP = Math.floor(Math.random() * 1000);
        setMonsterHP(randomHP);
        setMonsterMaxHP(randomHP);
        setMonsterName(monsters[currentMonster].name);
        setMonsterKey(currentMonster);
        setIdleUrl(monsters[currentMonster]?.idle || "");
        setHurtUrl(monsters[currentMonster]?.hurt || "");
        setMonsterState("idle");
    }

	useListenFor('donation', (donation: FormattedDonation) => {
        messageQueueRef.current.push({kind: 'donation', item: donation});
        
        if (!dialogTimerRef.current && !currentMessage) {
            showNextDonationOrSubscription();
        }
	});
    
    function showNextDonationOrSubscription() {
        const next = messageQueueRef.current.shift();
        if (!next) {
            setCurrentMessage(undefined);
            return;
        }
        setCurrentMessage(next);
        
          if (dialogTimerRef.current) {
            clearTimeout(dialogTimerRef.current);
        }

        dialogTimerRef.current = setTimeout(() => {
            dialogTimerRef.current = null;
            showNextDonationOrSubscription();
        }, MESSAGE_DISPLAY_TIME);
        
        if (next.kind == 'donation') {
            setMonsterHP(oldHp => Math.floor(oldHp - next.item.rawAmount));               
            setMonsterState("hurt");
            hurtTimerRef.current = setTimeout(() => {
                setMonsterState("idle");
            }, 500);
            
            setDisplayTotal(prev => Math.floor(prev + (next.item.rawAmount ?? 0)));
        }       
    }
    
    useEffect(() => {
        return () => {
            if (dialogTimerRef.current) clearTimeout(dialogTimerRef.current);
            if (hurtTimerRef.current) clearTimeout(hurtTimerRef.current);
            if (victoryTimerRef.current) clearTimeout(victoryTimerRef.current);
        };
    }, []);
    
    useListenFor('subscription', (subscription: TwitchSubscription) => {
        messageQueueRef.current.push({ kind: 'subscription', item: subscription });
        
        if (!dialogTimerRef.current && !currentMessage) {
            showNextDonationOrSubscription();
        }
    });
    
    useEffect(() => {
        spawnMonster();
    }, []);

   useEffect(() => {
     if (monsterHP <= 0 && monsterName) {
        setShowVictoryDialog(true);
        setMonsterKey("");
        setIdleUrl("");
        setHurtUrl("");
        const timer = setTimeout(() => {
            setShowVictoryDialog(false);
            spawnMonster();
        }, MESSAGE_DISPLAY_TIME);
        victoryTimerRef.current = timer;
        return () => clearTimeout(timer);
    }
   }, [monsterHP, monsterName]);

   useEffect(() => {
        setHurtUrl(monsters[monsterKey]?.hurt || "");
        setIdleUrl(monsters[monsterKey]?.idle || "");
   }, [monsterState, monsterKey]);
   
   function Monster () {
        return (<MonsterContainer>
            <Label>{monsterName}</Label>
            <MonsterImage state={monsterState} />
            <HPBar/>
        </MonsterContainer>);
   }
   
    function HPBar () {
        return (<HPBarContainer>
            <HPBarBackground src={hpBar} />
            <HPBarFill src={hpBarFill} hpPercentage={monsterHP / monsterMaxHP} />
            <HPBarTop src={hpBarTop} />
        </HPBarContainer>)
    }
    const HPBarContainer = styled.div`
        position: absolute;
        bottom: 10px;
        width: 100%;
        height: 40px;
    `;
    
    const HPBarBackground = styled.img`
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
    `;
    
    const HPBarFill = styled.img<{hpPercentage: number}>`
        position: absolute;
        width: calc(${props => Math.max(0, Math.min(1, props.hpPercentage)) * 100}% -  8px);
        height: calc(100% - 8px);
        top: 4px;
        left: 4px;
        overflow: hidden;
    `;
    
    const HPBarTop = styled.img`
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
    `;
    
   function MonsterImage ({state}: {state: "idle" | "hurt"}) {
        return (
            <div className={state}>
                {state == "idle" && <MonsterIdle />}
                {state == "hurt" && <MonsterHurt />}
            </div>)
   }
   
   function Velocity () {
     return (
        <VelocityContainer>
            <Label>Velocity</Label>
            <NameTriangle/>
            <VelocityImage/>
        </VelocityContainer>
     )
   }

   
   function VictoryDialog () {
        if (!showVictoryDialog) return null;
        return (
            <VictoryDialogBox>
                You defeated {monsterName}!
            </VictoryDialogBox>
        )
   }
   
   const MonsterContainer = styled.div`
    position: absolute;
    top: ${TOP_MARGIN}px;
    right: 2%;
    width: 300px;
    height: 300px;    
`;

   
   const MonsterIdle = styled.div`
    background-image: url(${idleUrl});
    background-size: 1400px 280px;
    background-repeat: no-repeat;
    background-position: 0 0;
    width: 280px;
    height: 280px;
    transform: scale(1);
    animation: playIdle 1s steps(5) infinite;
    position: absolute;
    top: -4px;

     @keyframes playIdle {
        from { background-position: 0 0; }
        to { background-position: -1400px 0; }
    }

    
`;

const MonsterHurt = styled.div`
    background-image: url(${hurtUrl});
    background-size: 2520px 280px;
    background-repeat: no-repeat;
    background-position: 0 0;
    width: 280px;
    height: 280px;
    transform: scale(1);
    animation: playHurt 0.5s steps(9) infinite;
    position: absolute;
    
    @keyframes playHurt {
        from { background-position: 0 0; }
        to { background-position: -2520px 0; }
    }
`;
   
	return (
		<Container>
            <BG/>
            <Velocity/>
                 {currentMessage?.kind === 'donation' && (
                    <DonationDialog donation={currentMessage.item} />
                )}
                {currentMessage?.kind === 'subscription' && (
                    <SubscriptionDialog subscription={currentMessage.item} />
                )}
                <Monster/>
			<TotalEl>
				$<TweenNumber value={displayTotal} />
			</TotalEl>
            <VictoryDialog />

		</Container>
	);
}


const Container = styled.div`
	position: absolute;
	width: 100%;
	height: 100%;
	padding: 0;
	margin: 0;
`;

const BG = styled.div`
    position: absolute;
    width: 100%;
    height: 100%;
    background-image: url(${bg});
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
`;

const TotalEl = styled.div`
	font-family: gdqpixel;
	font-size: 32px;
	color: white;

	position: absolute;

	left: 50%;
	top: calc(100% - 28px);
	transform: translate(-50%, -50%);
`;

const DonationDialogBox = styled.div`
    font-family: gdqpixel;
    font-size: 32px;
    color: white;
    position: absolute;
    left: 50%;
    top: 13%;
    transform: translateX(-50%);
    box-sizing: border-box;
    padding: 28px;
    line-height: 1.25;
    max-width: 50%;
    background-image: url(${textbox});
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
    background-origin: padding-box;
    background-clip: padding-box;
    word-break: break-all;
`;

const NameTriangle = styled.div`
    width: 100%;
    height: 16px;
    background-image: url(${nameTriangle});
    background-position: center;
    background-size: contain;
    background-repeat: no-repeat;
    margin-top: 8px;
    position: absolute;
`;

const Label = styled.div`
    font-family: gdqpixel;
    font-size: 24px;
    text-align: center;
`;

const VelocityContainer = styled.div`
    position: absolute;
    top: ${TOP_MARGIN}px;
    left: 10px;
    width: 300px;
    height: 300px;
`;

const VelocityImage = styled.div`
    background-image: url(${velocity});
    background-size: 1500px 300px;
    background-repeat: no-repeat;
    background-position: top;
    width: 300px;
    height: 300px;
    animation: playChar 1s steps(5) infinite;
    transform: scale(1);
    position: absolute;
    left: 10%;
    top: -15%;
    
    @keyframes playChar {
        from { background-position: 0 0; }
        to { background-position: -1500px 0; }
    }
    
`;

const VictoryDialogBox = styled.div`
    bottom: 0;
    color: white;
    font-family: gdqpixel;
    font-size: 32px;
    left: 0;
    line-height: 1.25;
    margin: auto;
    padding: 72px 32px;
    position: absolute;
    right: 0;
    text-align: center;
    top: 0;
    width: 67%;
    background-image: url(${textbox});
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
    box-sizing: border-box;
    background-origin: padding-box;
    background-clip: padding-box;
    
    display: flex;
    align-items: center;
    justify-content: center;
`;

