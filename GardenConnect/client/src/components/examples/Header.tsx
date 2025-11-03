import Header from '../Header';

export default function HeaderExample() {
  return (
    <div>
      <Header showStartOver={true} />
      <div className="p-8 text-center text-muted-foreground">
        Content below header
      </div>
    </div>
  );
}
