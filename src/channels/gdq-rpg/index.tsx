import type { FormattedDonation, Total, TwitchSubscription } from '@gdq/types/tracker';
import { ChannelProps, registerChannel } from '../channels';
import { useState, useEffect, useRef } from 'react';

import { useListenFor, useReplicant } from 'use-nodecg';
import styled from '@emotion/styled';
import TweenNumber from '@gdq/lib/components/TweenNumber';

registerChannel('gdq-rpg', 95, GdqRpg, {
	position: 'bottomLeft',
	site: 'Twitch',
	handle: 'PIGSquad',
});

const MESSAGE_DISPLAY_TIME = 5000;

function DonationDialog ({donation}: {donation?: FormattedDonation}) {
    if (!donation) {
        return null; 
    }
    
    
    return <DonationDialogBox>
        Velocity donated for {Math.floor(donation.rawAmount)}!
    </DonationDialogBox>
}

type Monster = {
    name: string;
    img: string;
    hp: number; //we could also make this random
}

import placeholderImg from './assets/faces.png';

const monsters: Monster[] = [
    {
        name: "Bad RNG",
        img: placeholderImg,
        hp: 300
    },
        {
        name: "That's never happened before",
        img: placeholderImg,
        hp: 3000
    },
    {
        name: "Laggy Boy",
        img: placeholderImg,
        hp: 500
    }
]



function GdqRpg(props: ChannelProps) {
	const [total] = useReplicant<Total | null>('total', null);
    const dialogTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [latestDonation, setLatestDonation] = useState<FormattedDonation>();
    const [monsterHP, setMonsterHP] = useState<number>(0);
    const [monsterImg, setMonsterImg] = useState<string>("");
    const [monsterName, setMonsterName] = useState<string>("");
    const [victoryTimer, setVictoryTimer] = useState<NodeJS.Timeout | null>(null);
    const [showVictoryDialog, setShowVictoryDialog] = useState<boolean>(false);
    
    function spawnMonster () {
        //selects a random monster from the list
        const {name, img, hp} = monsters[Math.floor(Math.random() * monsters.length)];
        
        setMonsterHP(hp);
        setMonsterImg(img);
        setMonsterName(name);
        
    }

	useListenFor('donation', (donation: FormattedDonation) => {
        if (dialogTimerRef.current) {
            clearTimeout(dialogTimerRef.current);
        }
        
        setLatestDonation(donation);
        
        dialogTimerRef.current = setTimeout(() => {
            setLatestDonation(undefined);
        }, MESSAGE_DISPLAY_TIME);
        
        setMonsterHP(oldHp => Math.floor(oldHp - donation.rawAmount));
	});
    
    useListenFor('subscription', (subscription: TwitchSubscription) => {
       console.log('subscription received', subscription); 
    });
    
    useEffect(() => {
        spawnMonster();
    }, []);

   useEffect(() => {
     if (monsterHP <= 0 && monsterName) {
        setShowVictoryDialog(true);
        const timer = setTimeout(() => {
            setShowVictoryDialog(false);
            spawnMonster();
        }, MESSAGE_DISPLAY_TIME);
        setVictoryTimer(timer);
        return () => clearTimeout(timer);
    }
   }, [monsterHP, monsterName]);
   
   function Monster () {
        return (<MonsterContainer>
            <Label>{monsterName}</Label>
            <MonsterImage/>

        </MonsterContainer>);
   }
   
   function Velocity () {
     return (
        <VelocityContainer>
            <Label>Velocity</Label>
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
   
   const MonsterImage = styled.div`
    background-image: url(${monsterImg});
    background-size: auto;
    background-repeat: no-repeat;
    background-position: center;
    width: 24px;
    height: 24px;
    transform: scale(1);
    animation: playMonster 2s steps(5) infinite;
    
    @keyframes playMonster {
        from { background-position: 0 0; }
        to { background-position: -120px 0; }
    }
    
`;
   
	return (
		<Container>
            <Velocity/>
                <DonationDialog donation={latestDonation} />
                <VictoryDialog />
                <Monster/>
			<TotalEl>
				$<TweenNumber value={Math.floor(total?.raw ?? 0)} />
			</TotalEl>
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
    top: 20%;
    transform: translate(-50%, -50%);
    padding: 12px;
    border: 2px solid white;
    border-radius: 4px;
    line-height: 1.25;
    max-width: 33%;
`;

const MonsterContainer = styled.div`
    position: absolute;
    top: 15%;
    left: 67%;
    border: 1px dotted hotpink;
    width: 31%;
    height: 80%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    justify-content: flex-start;
`;

const VelocityContainer = styled.div`
     position: absolute;
    top: 15%;
    left: 2%;
    border: 1px dotted hotpink;
    width: 31%;
    height: 80%;
`;

const Label = styled.div`
    font-family: gdqpixel;
    font-size: 24px;
    text-align: center;
`;

const VictoryDialogBox = styled.div`
    font-family: gdqpixel;
    font-size: 32px;
    color: black;
    position: absolute;
    left: 50%;
    top: 40%;
    transform: translate(-50%, -50%);
    padding: 24px;
    border: 2px solid white;
    background-color: hotpink;
    border-radius: 4px;
    line-height: 1.25;
    width: 67%;
    text-align: center;
`;

