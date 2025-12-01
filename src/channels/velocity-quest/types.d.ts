export type MessageQueueItem = 
    | { kind: 'donation'; item: FormattedDonation }
  | { kind: 'subscription'; item: TwitchSubscription };

export type MonsterType = {
    name: string;
    hurt: string;
    idle: string;
}