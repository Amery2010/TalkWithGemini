// @vitest-environment jsdom

import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import MessageInput from "@/components/chat/MessageInput";
import configMessages from "@/i18n/locales/en/Config.json";
import messageInputMessages from "@/i18n/locales/en/MessageInput.json";
import { useChatStore } from "@/store/core/chatStore";
import { useSettingsStore } from "@/store/core/settingsStore";
import type { Session, TextSkill } from "@/types";

vi.mock("next/dynamic", () => ({
  default: () => () => null,
}));

const skill: TextSkill = {
  id: "translation-localization",
  name: "translation-localization",
  title: "Translation & Localization",
  description: "Translate and localize text.",
  category: "writing",
  tags: ["translation"],
  audience: "user-facing",
  language: "en",
  outputFormat: "markdown",
  risk: {
    level: "low",
    textOnly: true,
    scriptRequired: false,
    externalToolRequired: false,
    networkRequired: false,
    reviewRequiredForHighStakes: true,
  },
  activation: {
    embeddingText: "translation localization",
    useWhen: ["Translate text"],
    avoidWhen: [],
    exampleQueries: ["translate to Chinese"],
  },
  content: "# Translation & Localization",
  builtIn: true,
};

function renderInput(onSend = vi.fn()) {
  return render(
    <NextIntlClientProvider
      locale="en"
      messages={{
        Config: configMessages,
        MessageInput: messageInputMessages,
      }}
    >
      <MessageInput
        onSend={onSend}
        disabled={false}
        selectedModel="provider:model"
      />
    </NextIntlClientProvider>,
  );
}

async function selectSkill() {
  const user = userEvent.setup();

  await user.click(screen.getByRole("button", { name: "Skills" }));
  const item = await screen.findByRole("menuitemcheckbox", {
    name: skill.title,
  });
  expect(item.getAttribute("aria-checked")).toBe("false");
  await user.click(item);

  return item;
}

beforeEach(() => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: false })),
  );
  useChatStore.setState({
    currentSessionId: null,
    sessions: [],
  });
  useSettingsStore.setState({ installedSkills: [skill] });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  useSettingsStore.setState({ installedSkills: [] });
});

describe("MessageInput Skills selection", () => {
  it("keeps a Skill selected before the first conversation is created", async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    renderInput(onSend);

    const item = await selectSkill();

    await waitFor(() => expect(item.getAttribute("aria-checked")).toBe("true"));

    await user.keyboard("{Escape}");
    await user.type(screen.getByRole("textbox", { name: "Message" }), "Hello");
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(onSend).toHaveBeenCalledWith("Hello", [], undefined, undefined, {
      skillIds: [],
      pluginIds: [],
      pendingSessionSkillIds: [skill.id],
    });
  });

  it("persists a Skill selection in an existing conversation", async () => {
    const session: Session = {
      id: "session-1",
      title: "Existing chat",
      messageCount: 0,
      updatedAt: Date.now(),
      model: "provider:model",
    };
    useChatStore.setState({
      currentSessionId: session.id,
      sessions: [session],
    });
    renderInput();

    const item = await selectSkill();

    await waitFor(() => expect(item.getAttribute("aria-checked")).toBe("true"));
    expect(useChatStore.getState().sessions[0].config?.activeSkills).toEqual([
      skill.id,
    ]);
  });
});
