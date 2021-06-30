export function getTimeRemaining(endtime: any) {
    const fk = {
        fucking: `${new Date()}`
    }
    const total = Date.parse(endtime) - Date.parse(fk.fucking);
    const seconds = Math.floor( (total/1000) % 60 );
    const minutes = Math.floor( (total/1000/60) % 60 );
    const hours = Math.floor( (total/(1000*60*60)) % 24 );
    const days = Math.floor( total/(1000*60*60*24) );
  
    return {
      total,
      days,
      hours,
      minutes,
      seconds
    };
}