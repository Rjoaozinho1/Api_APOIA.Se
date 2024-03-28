const express = require('express')
const app = express()
const axios = require('axios')
const fs = require('fs')

// primeira API de trazer o indetify do cliente
const obterTelefoneCliente = async (numeroDeTelefone) => {

    var diaAtual = new Date()
    var numeroAleatorio = diaAtual.getTime()

    try {

        const data = {
            id: `${numeroAleatorio}`,
            to: "postmaster@wa.gw.msging.net",
            method: "get",
            uri: `lime://wa.gw.msging.net/accounts/+${numeroDeTelefone}`//trazer esse telefone do Blip
        }

        const headers = {
            'Authorization': 'Key cm90ZWFkb3JhcG9pYXNlOnZkbnFETjJYNVEzS3U1c2FOQUk4',
            'Content-Type': 'application/json'
        }

        const response = await axios.post('https://http.msging.net/commands', data, { headers })
        const telefoneCliente = response.data.resource.identity

        return telefoneCliente

    } catch (error) {
        return error
    }
}

function TratarArray(opcao) {
    let i
    opcoes = []

    for (i = 0; i < opcao.length; i++) {
        opcoes.push(opcao[i].title)
    }

    return opcoes.join(', ')
}

function TratarBotao(opcao) {
    let i
    opcoes = []

    for (i = 0; i < opcao.length; i++) {
        opcoes.push(opcao[i].text)
    }

    return opcoes.join(', ')
}

function TratarData(stringDate) {

    var dataHora = new Date(stringDate)

    // Ajustando para o fuso horário de Brasília (UTC-3)
    dataHora.setUTCHours(dataHora.getUTCHours() - 3)

    // Obtendo os componentes da data
    var dia = String(dataHora.getUTCDate()).padStart(2, '0')
    var mes = String(dataHora.getUTCMonth() + 1).padStart(2, '0')
    var ano = dataHora.getUTCFullYear()

    // Formatando a data no formato desejado
    var dataFormatada = dia + '/' + mes + '/' + ano

    // Obtendo os componentes da hora
    var hora = String(dataHora.getUTCHours()).padStart(2, '0')
    var minuto = String(dataHora.getUTCMinutes()).padStart(2, '0')
    var segundo = String(dataHora.getUTCSeconds()).padStart(2, '0')
    var milissegundo = String(dataHora.getUTCMilliseconds()).padStart(3, '0')

    // Formatando a hora no formato desejado
    var horaFormatada = hora + ':' + minuto + ':' + segundo + '.' + milissegundo

    return { data: dataFormatada, hora: horaFormatada }
}

//obter o historico do cliente dentro do bot
const obterConversaCliente = async (numeroDeTelefone) => {

    var diaAtual = new Date()
    var numeroAleatorio = diaAtual.getTime()

    try {

        const data = {
            id: `${numeroAleatorio}`,
            method: 'get',
            uri: `/threads/${numeroDeTelefone}?$take=100`
        }

        const headers = {
            'Authorization': 'Key cm90ZWFkb3JhcG9pYXNlOnZkbnFETjJYNVEzS3U1c2FOQUk4',
            'Content-Type': 'application/json'
        }

        const response = await axios.post('https://http.msging.net/commands', data, { headers })
        
        const conversa = Organizar_Conversa(response.data)

        function Organizar_Conversa(retornoApiBlip) {

            const conversa = retornoApiBlip.resource.items
            //console.log(conversa)


            var novaConversa = JSON.stringify(conversa, null, 2)
                .replace(/'([^']+)'/g, '"$1"') // Substituir aspas simples por aspas duplas
                .replace(/"([^"]+)"\s*:\s*"([^"]+)"/g, '"$1": "$2"') // Adicionar aspas duplas em torno de chaves e valores
                .replace(/'/g, '') // Remover todas as aspas restantes

            //variavel que trataremos as conversas
            novaConversa = JSON.parse(novaConversa)

            //deixar as mensagens em ordem cronologica
            novaConversa = novaConversa.reverse()
            //console.log(novaConversa)
            //organizar as mensagens
            let i = 0
            context = []
            let data = {}
            while (i < novaConversa.length) {
                //console.log('\n')
                //console.log('\n')
                //console.log("contagem:"+i)
                //console.log(novaConversa.length)
                //console.log(novaConversa[i].direction)
                //console.log(novaConversa[i].type)
                //console.log(novaConversa[i].content)
                //console.log(novaConversa[i].date)

                try {

                    if (novaConversa[i].direction === "sent" && novaConversa[i].type === "text/plain") {

                        data = {
                            status: "Enviado",//novaConversa[i].direction,
                            conteudo: novaConversa[i].content,
                            data_hora: TratarData(novaConversa[i].date)
                        }

                    } else if (novaConversa[i].direction === "sent" && novaConversa[i].type === "application/vnd.lime.select+json") {

                        data = {
                            status: "Enviado",//novaConversa[i].direction,
                            conteudo: novaConversa[i].content.text,
                            opcoes: TratarBotao(novaConversa[i].content.options),
                            data_hora: TratarData(novaConversa[i].date)
                        }

                    } else if (novaConversa[i].direction === "sent" && novaConversa[i].type === "application/json") {

                        if (novaConversa[i].content.type == "template") {

                            data = {
                                status: "Enviado",//novaConversa[i].direction,
                                conteudo: novaConversa[i].content.type,
                                opcoes: novaConversa[i].content.template.name,
                                //opcoes: TratarArray(novaConversa[i].content.template.components),
                                data_hora: TratarData(novaConversa[i].date)
                            }

                        } else {

                            data = {
                                status: "Enviado",//novaConversa[i].direction,
                                conteudo: novaConversa[i].content.interactive.body.text,
                                opcoes: TratarArray(novaConversa[i].content.interactive.action.sections[0].rows),
                                data_hora: TratarData(novaConversa[i].date)
                            }

                        }

                    } else if (novaConversa[i].direction === "sent" && novaConversa[i].type === "application/vnd.lime.media-link+json") {

                        data = {
                            status: "Enviado",//novaConversa[i].direction,
                            conteudo: novaConversa[i].content.uri,
                            legenda: "Para acessar esse documento é preciso estar logado no Blip e acessar esse link: https://apoia.blip.ai/application/detail/roteadorapoiase/plugin/7d540026-e289-4cb8-af1d-a59b9918a8e8",
                            data_hora: TratarData(novaConversa[i].date)
                        }

                    } else if (novaConversa[i].direction === "received" && novaConversa[i].type === "application/vnd.lime.media-link+json") {

                        data = {
                            status: "Recebido",//novaConversa[i].direction,
                            conteudo: novaConversa[i].content.uri,
                            legenda: "Para acessar esse documento é preciso estar logado no Blip e acessar esse link: https://apoia.blip.ai/application/detail/roteadorapoiase/plugin/7d540026-e289-4cb8-af1d-a59b9918a8e8",
                            data_hora: TratarData(novaConversa[i].date)
                        }

                    } else if (novaConversa[i].direction == "received" && novaConversa[i].type === "application/vnd.iris.ticket+json") {

                        data = {
                            status: "Recebido",//novaConversa[i].direction,
                            conteudo: "Ticket Aberto: " + novaConversa[i].content.sequentialId,
                            data_hora: TratarData(novaConversa[i].date)
                        }

                    } else if (novaConversa[i].direction == "received" && novaConversa[i].type === "application/vnd.lime.reply+json") {

                        data = {
                            status: "Recebido",//novaConversa[i].direction,
                            conteudo: novaConversa[i].content.replied.value,
                            data_hora: TratarData(novaConversa[i].date)
                        }

                    } else if (novaConversa[i].direction == "received" && novaConversa[i].type === "text/plain") {

                        data = {
                            status: "Recebido",//novaConversa[i].direction,
                            conteudo: novaConversa[i].content,
                            data_hora: TratarData(novaConversa[i].date)
                        }

                    } else {

                        data = {
                            status: novaConversa[i].direction,
                            conteudo: novaConversa[i].content,
                            data_hora: TratarData(novaConversa[i].date)
                        }

                    }
                } catch (e) {

                    data = {
                        status: "Erros",
                        conteudo: "erro:" + e,
                        data_hora: TratarData(novaConversa[i].date)
                    }

                }
                //console.log(data)
                context.push(data)
                i++
                //console.log(i)
            }

            var diaAtual = new Date()

            var timestamp = diaAtual.getTime()

            diaAtual = TratarData(diaAtual)

            //console.log("CONTEXTO: " + context)
            //console.log("NOVA CONVERSA: " + novaConversa)
            
            try {
                let conversaFormatada = '';
                let indexs = []
                for (let i = 0; i < context.length; i++) {
                    
                    if (context[i].data_hora.data === diaAtual.data) {
                        
                        // Encontrar o índice da última mensagem de boas-vindas
                        let indiceUltimaBoasVindas = -1;
                       
                        if (context[i].conteudo === 'Olá, seja bem-vindo(a) ao atendimento da *APOIA.se* 🥰.' || context[i].conteudo === 'Olá, seja bem-vindo(a) ao atendimento da *APOIA.se*.') {
                            indiceUltimaBoasVindas = i;
                            indexs.push(indiceUltimaBoasVindas)
                        } else if(context[i].conteudo === 'template') {
                            indiceUltimaBoasVindas = i + 1;
                            indexs.push(indiceUltimaBoasVindas)
                        }

                        //checar o maior indice dentro do a indexs
                        var maiorIndex = Math.max.apply(null, indexs);
                    }
                    
                }

                // console.log(maiorIndex)
                // Se encontrar a última mensagem de boas-vindas
                if (maiorIndex !== -1) {
                            
                    // Iterar a partir da última mensagem de boas-vindas até a mensagem de finalização
                    for (let j = maiorIndex - 1; j < context.length; j++) {

                        // Adicionar a mensagem ao resultado
                        if (context[j].opcoes) {
                            var op = context[j].opcoes
                            conversaFormatada += context[j].status.toString() + "\n" + context[j].conteudo.toString() + "\n" + op + "\n" + context[j].data_hora.data.toString() + " " + context[j].data_hora.hora.toString() + "\n\n"

                        } else if (context[j].legenda) {

                            conversaFormatada += context[j].status.toString() + "\n" + context[j].conteudo.toString() + "\n" + context[j].legenda.toString() + "\n" + context[j].data_hora.data.toString() + " " + context[j].data_hora.hora.toString() + "\n\n"

                        } else {

                            conversaFormatada += context[j].status.toString() + "\n" + context[j].conteudo.toString() + "\n" + context[j].data_hora.data.toString() + " " + context[j].data_hora.hora.toString() + "\n\n"

                        }

                        // Verificar se a mensagem atual é a de finalização
                        if (context[j].conteudo === 'A *APOIA.se* agradece o contato, até breve 👋🏾') {
                            break; // Encerrar a iteração ao encontrar a mensagem de finalização
                        }
                    }
                }

                //console.log(conversaFormatada)
                return conversaFormatada;
            } catch (error) {
                console.error('Erro ao formatar a conversa do cliente:', error.message);
                return error;
            }

        }
        //console.log(conversa)
        return conversa

    } catch (error) {
        console.error('Erro ao obter a conversa do cliente:', error.message)
        return error
    }
}

// enviar o arquivo binario para o pipedrive
const enviarNotasPipedrive = async (notas, idPipe, token) => {
    try {

        //const data = {
        //    file: fs.createReadStream(`Pasta_de_arquivos/${arquivo}`),
        //    person_id: `${idPipe}`//trazer este id do person, ou seja, do corpo da requisição
        //}

        console.log(notas)
        var id_Deal = parseInt(idPipe)

        const data = {
            content: notas,
            deal_id: id_Deal // trazer este id do deal, ou seja, do corpo da requisição
        }

        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }

        const URL = "https://api.pipedrive.com/v1/notes?api_token=" + token

        const response = await axios.post(URL, data, { headers })

        return response.data

    } catch (error) {
        console.error('Erro ao enviar o arquivo para o Pipedrive:', error.message);
        return error
    }
}

// Middleware para analisar o corpo da solicitação JSON
app.use(express.json())

// Rota GET com dois parâmetros na URL
app.post('/api', async (req, res) => {
    
    try {
        const { telefone, id , tokenPipe} = req.body
        //id 34494
        const token = req.headers['authorization']

        // Verifica se o token foi enviado
        if (!token || token !== '3296584w6sdaf8443wt68a4edfrhg6a58eh74') {
            return res.status(401).json({ status: 'failed', erro: 'Token Inválido' })
        }

        // Verifica se os dados obrigatórios foram fornecidos
        if (!telefone || !id || !tokenPipe) {
            return res.status(400).json({ status: 'failed', erro: 'Telefone ou ID ou Token ausente(s)' })
        }

        const telefoneCliente = await obterTelefoneCliente(telefone)
        const conversaFormatada = await obterConversaCliente(telefoneCliente)

        // Enviar a conversa formatada como notas papa o Pipedrive
        await enviarNotasPipedrive(conversaFormatada, id, tokenPipe)

        return res.status(200).json({ status: 'success' })
    } catch (err) {
        return res.status(500).json({ erro: err.message || 'Ocorreu um erro interno' })
    }
})


// Porta onde o servidor Express irá ouvir
const PORT = 5036
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`)
})