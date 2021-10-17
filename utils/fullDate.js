const date = new Date()
exports.fullDate =()=>{
    return date.getFullYear()+'-'+date.getMonth()+'-'+date.getDate()+'_'+date.getHours()+'-'+date.getMinutes()+'-'+date.getSeconds()
} 