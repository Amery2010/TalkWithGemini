import { FunctionDeclarationSchemaType, type FunctionDeclaration } from '@google/generative-ai'

async function makeApiRequest(currencyFrom: string, currencyTo: string) {
  // This hypothetical API returns a JSON such as:
  // {"base":"USD","rates":{"SEK": 0.091}}
  return {
    base: currencyFrom,
    rates: { [currencyTo]: 0.091 },
  }
}

export const functions: Record<string, Function> = {
  getExchangeRate: ({ currencyFrom, currencyTo }: { currencyFrom: string; currencyTo: string }) => {
    return makeApiRequest(currencyFrom, currencyTo)
  },
}

export const getExchangeRateFunctionDeclaration: FunctionDeclaration = {
  name: 'getExchangeRate',
  parameters: {
    type: FunctionDeclarationSchemaType.OBJECT,
    description: 'Get the exchange rate for currencies between countries',
    properties: {
      currencyFrom: {
        type: FunctionDeclarationSchemaType.STRING,
        description: 'The currency to convert from.',
      },
      currencyTo: {
        type: FunctionDeclarationSchemaType.STRING,
        description: 'The currency to convert to.',
      },
    },
    required: ['currencyTo', 'currencyFrom'],
  },
}
