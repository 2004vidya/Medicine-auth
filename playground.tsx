export async function GET(req){
    const medicine = await prisma.medicine.findFirst({
        where:{
            OR:[
                {name:{equals:query}}
            ]
        }
    })

}

